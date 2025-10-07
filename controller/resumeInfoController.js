const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createResumeInfo = async (req, res) => {
  try {
    const { basicInfo, skills, projects, experience, education } = req.body;
    const userId = req.user.id;

    if (!basicInfo || !basicInfo.name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if user already has resume info
    const existingResumeInfo = await prisma.resumeInfo.findFirst({
      where: { userId },
      include: {
        skills: true,
        projects: true,
        experiences: true,
        educations: true
      }
    });

    let resumeInfo;

    if (existingResumeInfo) {
      // Update existing resume info
      // First, delete all related data
      await prisma.skill.deleteMany({ where: { resumeInfoId: existingResumeInfo.id } });
      await prisma.project.deleteMany({ where: { resumeInfoId: existingResumeInfo.id } });
      await prisma.experience.deleteMany({ where: { resumeInfoId: existingResumeInfo.id } });
      await prisma.education.deleteMany({ where: { resumeInfoId: existingResumeInfo.id } });

      // Update the resume info with new data
      resumeInfo = await prisma.resumeInfo.update({
        where: { id: existingResumeInfo.id },
        data: {
          name: basicInfo.name || 'John Doe',
          jobRole: basicInfo.jobRole || 'Developer',
          summary: basicInfo.summary || '',
          email: basicInfo.email || '',
          phone: basicInfo.phone || '',
          linkedin: basicInfo.linkedin || '',
          skills: {
            create: skills && skills.length ? skills.map(skill => ({ name: skill })) : []
          },
          projects: {
            create: projects && projects.length ? projects.map(project => ({
              title: project.title || '',
              description: project.description || '',
              technologies: project.technologies || ''
            })) : []
          },
          experiences: {
            create: experience && experience.length ? experience.map(exp => ({
              company: exp.company || '',
              role: exp.role || '',
              startDate: new Date(exp.startDate) || new Date(),
              endDate: exp.endDate ? new Date(exp.endDate) : null,
              description: exp.description || ''
            })) : []
          },
          educations: {
            create: education && education.length ? education.map(edu => ({
              institution: edu.institution || '',
              degree: edu.degree || '',
              startDate: new Date(edu.startDate) || new Date(),
              endDate: edu.endDate ? new Date(edu.endDate) : null,
              grade: edu.grade || ''
            })) : []
          }
        },
        include: {
          skills: true,
          projects: true,
          experiences: true,
          educations: true
        }
      });

      return res.status(200).json({ message: 'Resume info updated', resumeInfo });
    } else {
      // Create new resume info
      resumeInfo = await prisma.resumeInfo.create({
        data: {
          userId,
          name: basicInfo.name || 'John Doe',
          jobRole: basicInfo.jobRole || 'Developer',
          summary: basicInfo.summary || '',
          email: basicInfo.email || '',
          phone: basicInfo.phone || '',
          linkedin: basicInfo.linkedin || '',
          skills: {
            create: skills && skills.length ? skills.map(skill => ({ name: skill })) : []
          },
          projects: {
            create: projects && projects.length ? projects.map(project => ({
              title: project.title || '',
              description: project.description || '',
              technologies: project.technologies || ''
            })) : []
          },
          experiences: {
            create: experience && experience.length ? experience.map(exp => ({
              company: exp.company || '',
              role: exp.role || '',
              startDate: new Date(exp.startDate) || new Date(),
              endDate: exp.endDate ? new Date(exp.endDate) : null,
              description: exp.description || ''
            })) : []
          },
          educations: {
            create: education && education.length ? education.map(edu => ({
              institution: edu.institution || '',
              degree: edu.degree || '',
              startDate: new Date(edu.startDate) || new Date(),
              endDate: edu.endDate ? new Date(edu.endDate) : null,
              grade: edu.grade || ''
            })) : []
          }
        },
        include: {
          skills: true,
          projects: true,
          experiences: true,
          educations: true
        }
      });

      return res.status(201).json({ message: 'Resume info created', resumeInfo });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to save resume info' });
  }
};

exports.getResumeInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const resumeInfo = await prisma.resumeInfo.findFirst({
      where: { userId },
      include: {
        skills: true,
        projects: true,
        experiences: true,
        educations: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    if (!resumeInfo) {
      return res.status(404).json({ error: 'Resume info not found' });
    }

    return res.status(200).json(resumeInfo);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to retrieve resume info' });
  }
};