import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Constants } from '../../CommonsModule/constants';
import { NeedRole } from '../../CommonsModule/guard/role-metadata.guard';
import { RoleGuard } from '../../CommonsModule/guard/role.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CourseMapper } from '../mapper/course.mapper';
import { User } from '../../UserModule/entity/user.entity';
import { CourseDTO } from '../dto/course.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CourseUpdateDTO } from '../dto/course-update.dto';
import { CourseService } from '../service/course.service';
import { SecurityService } from '../../SecurityModule/service/security.service';
import { RoleEnum } from '../../SecurityModule/enum/role.enum';
import { NewCourseDTO } from '../dto/new-course.dto';
import { NewUserDTO } from '../../UserModule/dto/new-user.dto';
import { Course } from '../entity/course.entity';
import { AppConfigService as ConfigService } from '../../ConfigModule/service/app-config.service';

@ApiTags('Course')
@ApiBearerAuth()
@Controller(
  `${Constants.API_PREFIX}/${Constants.API_VERSION_1}/${Constants.COURSE_ENDPOINT}`,
)
export class CourseController {
  constructor(
    private readonly service: CourseService,
    private readonly mapper: CourseMapper,
    private readonly securityService: SecurityService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Get Courses', description: 'Get all Courses' })
  @ApiQuery({
    name: 'enabled',
    type: Boolean,
    required: false,
    description:
      'If not passed, get all courses. If passed, get courses that are enabled or disabled depending on the boolean',
  })
  @ApiOkResponse({ type: CourseDTO, isArray: true, description: 'All Courses' })
  @NeedRole(RoleEnum.ADMIN, RoleEnum.STUDENT)
  @UseGuards(RoleGuard)
  public async getAll(
    @Headers('authorization') authorization: string,
    @Query('enabled') enabledString?: string,
  ): Promise<CourseDTO[]> {
    let enabled = enabledString == null ? null : enabledString == 'true';
    const { role }: User = this.securityService.getUserFromToken(
      authorization.split(' ')[1],
      this.configService.jwtSecret,
    );
    if (role.name === RoleEnum.STUDENT) enabled = true;
    return this.mapper.toDtoList(await this.service.getAll(enabled));
  }

  @Get('/:id')
  @HttpCode(200)
  @ApiOkResponse({ type: CourseDTO })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'Course id',
  })
  @ApiOperation({
    summary: 'Find Course by id',
    description: 'Find Course by id',
  })
  @NeedRole(RoleEnum.ADMIN, RoleEnum.STUDENT)
  @UseGuards(RoleGuard)
  public async findById(@Param('id') id: CourseDTO['id']): Promise<CourseDTO> {
    return this.mapper.toDto(await this.service.findById(id));
  }

  @Get('/slug/:slug')
  @HttpCode(200)
  @ApiOkResponse({ type: CourseDTO })
  @ApiParam({
    name: 'slug',
    type: String,
    required: true,
    description: 'Course slug',
  })
  @ApiOperation({
    summary: 'Find Course by slug',
    description: 'Find Course by slug',
  })
  @NeedRole(RoleEnum.ADMIN, RoleEnum.STUDENT)
  @UseGuards(RoleGuard)
  public async findBySlug(
    @Param('slug') slug: CourseDTO['slug'],
  ): Promise<CourseDTO> {
    return this.mapper.toDto(await this.service.findBySlug(slug));
  }

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  @HttpCode(201)
  @ApiCreatedResponse({ type: CourseDTO, description: 'Course created' })
  @ApiOperation({ summary: 'Add course', description: 'Creates a new course' })
  @ApiBody({ type: NewCourseDTO })
  @NeedRole(RoleEnum.ADMIN)
  @UseGuards(RoleGuard)
  public async add(
    @Body() course: NewCourseDTO,
    @UploadedFile() file,
  ): Promise<CourseDTO> {
    return this.mapper.toDto(await this.service.add(course, file));
  }

  @Put('/:id')
  @HttpCode(200)
  @ApiOkResponse({ type: CourseDTO })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'Course id',
  })
  @ApiOperation({
    summary: 'Update course',
    description: 'Update course by id',
  })
  @ApiBody({ type: CourseUpdateDTO })
  @NeedRole(RoleEnum.ADMIN)
  @UseGuards(RoleGuard)
  public async update(
    @Param('id') id: CourseDTO['id'],
    @Body() courseUpdatedInfo: CourseUpdateDTO,
  ): Promise<CourseDTO> {
    return this.mapper.toDto(await this.service.update(id, courseUpdatedInfo));
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOkResponse({ type: null })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'Course id',
  })
  @ApiOperation({
    summary: 'Delete course',
    description: 'Delete course by id',
  })
  @NeedRole(RoleEnum.ADMIN)
  @UseGuards(RoleGuard)
  public async delete(@Param('id') id: CourseDTO['id']): Promise<void> {
    await this.service.delete(id);
  }

  @Get('author/:name')
  @HttpCode(200)
  @ApiOkResponse({ type: NewUserDTO })
  @ApiParam({
    name: 'name',
    type: Number,
    required: true,
    description: 'Author name',
  })
  @ApiOperation({
    summary: 'Find courses by author name',
    description: 'Find courses by author name',
  })
  @ApiNotFoundResponse({ description: 'thrown if courses are not found' })
  @ApiUnauthorizedResponse({
    description:
      'thrown if there is not an authorization token or if authorization token does not have ADMIN, STUDENT or EXTERNAL role',
  })
  @NeedRole(RoleEnum.ADMIN, RoleEnum.STUDENT, RoleEnum.EXTERNAL)
  @UseGuards(RoleGuard)
  public async findByAuthorName(
    @Param('name') authorName: Course['authorName'],
  ): Promise<CourseDTO[]> {
    return this.mapper.toDtoList(
      await this.service.findByAuthorName(authorName),
    );
  }
}
