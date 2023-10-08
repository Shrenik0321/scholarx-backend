import type { Request, Response } from 'express'
import {
  createMentor,
  updateAvailability,
  getMentor
} from '../services/mentor.service'
import type Profile from '../entities/profile.entity'
import Mentor from '../entities/mentor.entity'

interface MentorResponse {
  statusCode: number
  message?: string
  mentor?: Mentor | null
  updatedMentorApplication?: Mentor | null
  mentorDetails?: {
    mentorId: string
    category: string
    profile: {
      contact_email: string
      first_name: string
      last_name: string
      image_url: string
      linkedin_url: string
    }
  } | null
}

export const mentorApplicationHandler = async (
  req: Request,
  res: Response
): Promise<MentorResponse> => {
  try {
    const user = req.user as Profile
    const { application, categoryId } = req.body
    const { mentor, statusCode, message } = await createMentor(
      user,
      application,
      categoryId
    )

    return res.status(statusCode).json({ mentor, message })
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error executing query', err)
      return res
        .status(500)
        .json({ error: 'Internal server error', message: err.message })
    }

    throw err
  }
}

export const mentorAvailabilityHandler = async (
  req: Request,
  res: Response
): Promise<MentorResponse> => {
  try {
    const user = req.user as Profile
    const { availability } = req.body
    const { statusCode, updatedMentorApplication } = await updateAvailability(
      user,
      availability
    )

    return res.status(statusCode).json({ updatedMentorApplication })
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error executing query', err)
      return res
        .status(500)
        .json({ error: 'Internal server error', message: err.message })
    }

    throw err
  }
}

export const mentorDetailsHandler = async (
  req: Request,
  res: Response
): Promise<MentorResponse> => {
  try {
    const mentorId = req.params.mentorId
    const { mentor, statusCode, message } = await getMentor(mentorId)

    if (!mentor) {
      return res.status(statusCode).json({ error: message })
    } else {
      const mentorDetails = {
        mentorId: mentor.uuid,
        category: mentor.category.category,
        profile: {
          contact_email: mentor.profile.contact_email,
          first_name: mentor.profile.first_name,
          last_name: mentor.profile.last_name,
          image_url: mentor.profile.image_url,
          linkedin_url: mentor.profile.linkedin_url
        }
      }
      return res.status(statusCode).json({ ...mentorDetails })
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error('Error executing query', err)
      return res
        .status(500)
        .json({ error: 'Internal server error', message: err.message })
    }

    throw err
  }
}
