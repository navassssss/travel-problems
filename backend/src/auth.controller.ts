import { BadRequestException, Body, ConflictException, Controller, Get, Header, Logger, Post, Req, Res, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { PrismaService } from './prisma.service.js';

const stateCookie = 'amanah_google_state';
const stateOptions = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/auth/google/callback' };

@Controller('auth')
export class AuthController {
  private readonly jwt = new JwtService();
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly prisma: PrismaService) {}

  private config() {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, JWT_SECRET, FRONTEND_URL } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL || !JWT_SECRET || JWT_SECRET.length < 32) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }
    return {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callback: GOOGLE_CALLBACK_URL,
      secret: JWT_SECRET,
      frontend: new URL(FRONTEND_URL ?? 'http://localhost:5173').origin,
    };
  }

  @Get('google')
  start(@Res() response: Response) {
    const config = this.config();
    const state = randomBytes(32).toString('hex');
    response.cookie(stateCookie, state, { ...stateOptions, maxAge: 600_000 });
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callback,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });
    response.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params);
  }

  @Get('google/callback')
  async callback(@Req() request: Request, @Res() response: Response) {
    const config = this.config();
    const { code, state } = request.query;
    const expected = request.headers.cookie?.match(/(?:^|;\s*)amanah_google_state=([a-f0-9]{64})(?:;|$)/)?.[1];
    response.clearCookie(stateCookie, stateOptions);
    response.setHeader('Cache-Control', 'no-store');
    if (!expected || expected !== state || typeof code !== 'string') {
      response.redirect(config.frontend + '/#auth_error=google');
      return;
    }

    try {
      const exchange = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.callback,
          grant_type: 'authorization_code',
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!exchange.ok) throw new Error('Token exchange failed');
      const tokens = await exchange.json() as { access_token?: string };
      if (!tokens.access_token) throw new Error('Google access token missing');

      const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: 'Bearer ' + tokens.access_token },
        signal: AbortSignal.timeout(10000),
      });
      if (!profileResponse.ok) throw new Error('Profile lookup failed');
      const profile = await profileResponse.json() as {
        sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string;
      };
      if (!profile.sub || !profile.email || profile.email_verified !== true) throw new Error('Verified Google email required');

      const user = await this.prisma.client.user.upsert({
        where: { googleId: profile.sub },
        create: { googleId: profile.sub, email: profile.email.toLowerCase(), name: profile.name, avatarUrl: profile.picture },
        update: { name: profile.name, avatarUrl: profile.picture },
        select: { id: true },
      });
      const token = await this.jwt.signAsync({ sub: user.id }, {
        secret: config.secret, algorithm: 'HS256', issuer: 'amanah', audience: 'amanah-web', expiresIn: '1h',
      });
      response.redirect(config.frontend + '/#session=' + encodeURIComponent(token));
    } catch {
      this.logger.warn('Google sign-in callback failed');
      response.redirect(config.frontend + '/#auth_error=google');
    }
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  me(@Req() request: Request) {
    return this.account(request);
  }

  @Get('eligibility')
  @Header('Cache-Control', 'no-store')
  async eligibility(@Req() request: Request) {
    const user = await this.account(request);
    const eligibility = await this.prisma.client.eligibilityCase.findUnique({
      where: { applicantId: user.id },
      select: { status: true },
    });
    return { eligibility };
  }

  @Post('eligibility')
  @Header('Cache-Control', 'no-store')
  async submitEligibility(@Req() request: Request, @Body() body: unknown) {
    const user = await this.account(request);
    if (!body || typeof body !== 'object') throw new BadRequestException('Enter your household details');
    const fields = body as Record<string, unknown>;
    const { locality, postalCode, householdSize, monthlyIncomePaise, monthlyExpensesPaise, mahallId } = fields;
    if (typeof locality !== 'string' || !locality.trim() || locality.trim().length > 120 ||
        typeof postalCode !== 'string' || !/^\d{6}$/.test(postalCode) ||
        !this.isInteger(householdSize, 1, 100) ||
        !this.isInteger(monthlyIncomePaise, 0, 2147483647) ||
        !this.isInteger(monthlyExpensesPaise, 0, 2147483647) ||
        (mahallId !== null && (typeof mahallId !== 'string' || mahallId.length > 36))) {
      throw new BadRequestException('Check the locality, six-digit PIN code, household size and amounts');
    }

    const reviewingMahallId = user.mahallId ?? mahallId;
    try {
      const [, eligibility] = await this.prisma.client.$transaction([
        this.prisma.client.user.update({
          where: { id: user.id, mahallId: user.mahallId },
          data: { mahallId: reviewingMahallId },
          select: { id: true },
        }),
        this.prisma.client.eligibilityCase.create({
          data: { applicantId: user.id, reviewingMahallId, locality: locality.trim(), postalCode, householdSize, monthlyIncomePaise, monthlyExpensesPaise },
          select: { status: true },
        }),
      ]);
      return { eligibility };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new ConflictException('Your eligibility case has already been submitted');
        if (error.code === 'P2003') throw new BadRequestException('Select a registered Mahallu or no home Mahallu');
        if (error.code === 'P2025') throw new ConflictException('Your membership changed. Reload and try again');
      }
      throw error;
    }
  }

  private isInteger(value: unknown, min: number, max: number): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
  }

  private async account(request: Request) {
    const config = this.config();
    const token = request.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) throw new UnauthorizedException();
    let subject: string;
    try {
      const claims = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: config.secret, algorithms: ['HS256'], issuer: 'amanah', audience: 'amanah-web',
      });
      subject = claims.sub;
      if (typeof subject !== 'string' || !subject) throw new Error('Missing subject');
    } catch {
      throw new UnauthorizedException();
    }
    const user = await this.prisma.client.user.findUnique({
      where: { id: subject },
      select: { id: true, email: true, name: true, role: true, mahallId: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}

