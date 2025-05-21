import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradetide';

const seedUsers = [
  {
    username: 'Alice',
    email: 'alice@example.com',
    bio: 'Digital artist and language enthusiast',
    skillsOffered: ['Digital Art', 'French Lessons'],
    skillsWanted: ['Web Development', 'Yoga'],
  },
  {
    username: 'Bob',
    email: 'bob@example.com',
    bio: 'Web developer and fitness coach',
    skillsOffered: ['Web Development', 'Fitness Training'],
    skillsWanted: ['Digital Art', 'Photography'],
  },
  {
    username: 'Charlie',
    email: 'charlie@example.com',
    bio: 'Photographer and yoga instructor',
    skillsOffered: ['Photography', 'Yoga'],
    skillsWanted: ['Cooking Classes', 'French Lessons'],
  },
  {
    username: 'Diana',
    email: 'diana@example.com',
    bio: 'Cooking instructor and gardening enthusiast',
    skillsOffered: ['Cooking Classes', 'Gardening Tips'],
    skillsWanted: ['Fitness Training', 'Web Development'],
  },
  {
    username: 'Evan',
    email: 'evan@example.com',
    bio: 'Music teacher and coding enthusiast',
    skillsOffered: ['Piano Lessons', 'Guitar Lessons'],
    skillsWanted: ['Web Development', 'Digital Art'],
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Insert seed users
    const result = await User.insertMany(seedUsers);
    console.log(`Added ${result.length} users to the database`);

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 