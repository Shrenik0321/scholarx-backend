import { startServer } from '../../../app'
import type { Express } from 'express'
import supertest from 'supertest'
import Profile from '../../../entities/profile.entity'
import { ProfileTypes } from '../../../enums'
import { dataSource } from '../../../configs/dbConfig'
import bcrypt from 'bcrypt'
import { mockUser, mockAdmin } from '../../../../mocks'
import Category from '../../../entities/category.entity'

const port = Math.floor(Math.random() * (9999 - 3000 + 1)) + 3000

let server: Express
let agent: supertest.SuperAgentTest
let adminAgent: supertest.SuperAgentTest
let savedCategory: Category

describe('Admin category routes', () => {
  beforeAll(async () => {
    server = await startServer(port)
    agent = supertest.agent(server)
    adminAgent = supertest.agent(server)

    await supertest(server)
      .post('/api/auth/register')
      .send(mockUser)
      .expect(201)
    await agent.post('/api/auth/login').send(mockUser).expect(200)

    const profileRepository = dataSource.getRepository(Profile)

    const hashedPassword = await bcrypt.hash(mockAdmin.password, 10)
    const newProfile = profileRepository.create({
      primary_email: mockAdmin.email,
      password: hashedPassword,
      contact_email: '',
      first_name: '',
      last_name: '',
      image_url: '',
      linkedin_url: '',
      type: ProfileTypes.ADMIN
    })

    await profileRepository.save(newProfile)

    await adminAgent.post('/api/auth/login').send(mockAdmin).expect(200)

    const categoryRepository = dataSource.getRepository(Category)
    const newCategory = new Category('Random Category', [])
    savedCategory = await categoryRepository.save(newCategory)
  }, 5000)

  it('should add a category', async () => {
    await adminAgent
      .post('/api/admin/categories')
      .send({ categoryName: 'Computer Science' })
      .expect(201)
  })

  it('should only allow admins to add a category', async () => {
    await agent
      .post('/api/admin/categories')
      .send({ categoryName: 'Computer Science' })
      .expect(403)
  })

  it('should update a category', async () => {
    const response = await adminAgent
      .put(`/api/admin/categories/${savedCategory.uuid}`)
      .send({ categoryName: 'Science' })
      .expect(201)

    expect(response.body).toHaveProperty('category')
  })

  it('should return 404 when an invalid category id was provided', async () => {
    await adminAgent
      .put('/api/admin/categories/0058ab92-1c82-4af1-9f84-c60a3e922244')
      .send({ categoryName: 'Computer Science' })
      .expect(404)
  })

  it('should only allow admins to update a category', async () => {
    await agent
      .put(`/api/admin/categories/${savedCategory.uuid}`)
      .send({ categoryName: 'Science' })
      .expect(403)
  })
})
