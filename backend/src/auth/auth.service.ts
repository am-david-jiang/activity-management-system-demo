import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { Credential } from './entities/credential.entity';
import { Role, RoleType } from './entities/role.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Credential)
    private readonly credentialRepository: Repository<Credential>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const userRole =
      (await this.roleRepository.findOne({
        where: { name: RoleType.USER },
      })) || (await this.roleRepository.save({ name: RoleType.USER }));

    const user = this.userRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      roles: [userRole],
    });
    const savedUser = await this.userRepository.save(user);

    const credential = this.credentialRepository.create({
      password: hashedPassword,
      user: savedUser,
    });
    await this.credentialRepository.save(credential);

    return this.generateAuthResponse(savedUser);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('User is not exist');
    }

    const credential = await this.credentialRepository.findOne({
      where: { user: { id: user.id } },
      relations: {
        user: true,
      },
    });

    if (!credential) {
      throw new UnauthorizedException('Unable to find related credential');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      credential.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Wrong password');
    }

    return this.generateAuthResponse(user);
  }

  async logout(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException('User is not exist');
    }
    await this.credentialRepository.update({ user }, { refreshToken: null });
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    interface RefreshTokenPayload {
      sub: string;
      iat?: number;
      exp?: number;
    }

    const decoded = this.jwtService.verify<RefreshTokenPayload>(
      refreshTokenDto.refreshToken,
      { secret: process.env.JWT_REFRESH_SECRET },
    );

    const userId = decoded.sub;
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new BadRequestException('User is not exist');
    }

    const credential = await this.credentialRepository.findOne({
      where: { user: { id: user.id } },
      relations: { user: true },
    });

    if (!credential?.user || !credential.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isTokenValid = await bcrypt.compare(
      refreshTokenDto.refreshToken,
      credential.refreshToken,
    );
    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateAuthResponse(credential.user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return null;
    }

    const credential = await this.credentialRepository.findOne({
      where: { user: { id: user.id } },
      relations: { user: true },
    });
    if (!credential) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, credential.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private async generateAuthResponse(user: User): Promise<AuthResponseDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.name),
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.credentialRepository.update(
      { user },
      { refreshToken: hashedRefreshToken },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles.map((r) => r.name),
      },
    };
  }
}
