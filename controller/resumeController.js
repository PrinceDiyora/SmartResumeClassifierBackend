const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all resumes for a user
exports.getUserResumes = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const resumes = await prisma.resume.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        });
        
        return res.status(200).json(resumes);
    } catch (error) {
        console.error('Get Resumes Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get a single resume by ID
exports.getResumeById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const resume = await prisma.resume.findFirst({
            where: { 
                id,
                userId 
            }
        });
        
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        
        return res.status(200).json(resume);
    } catch (error) {
        console.error('Get Resume Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Create a new resume
exports.createResume = async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.user.id;
        
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }
        
        const newResume = await prisma.resume.create({
            data: {
                title,
                content,
                userId
            }
        });
        
        return res.status(201).json(newResume);
    } catch (error) {
        console.error('Create Resume Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Update an existing resume
exports.updateResume = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const userId = req.user.id;
        
        // Check if resume exists and belongs to user
        const existingResume = await prisma.resume.findFirst({
            where: { 
                id,
                userId 
            }
        });
        
        if (!existingResume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        
        // Update the resume
        const updatedResume = await prisma.resume.update({
            where: { id },
            data: {
                title: title || existingResume.title,
                content: content || existingResume.content,
            }
        });
        
        return res.status(200).json(updatedResume);
    } catch (error) {
        console.error('Update Resume Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Delete a resume
exports.deleteResume = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Check if resume exists and belongs to user
        const existingResume = await prisma.resume.findFirst({
            where: { 
                id,
                userId 
            }
        });
        
        if (!existingResume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        
        // Delete the resume
        await prisma.resume.delete({
            where: { id }
        });
        
        return res.status(200).json({ message: 'Resume deleted successfully' });
    } catch (error) {
        console.error('Delete Resume Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};