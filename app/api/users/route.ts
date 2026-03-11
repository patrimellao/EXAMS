import { allUsers } from '@/controllers/users';
import { NextResponse, NextRequest } from 'next/server';

export async function GET() {
    try {
       const results = await allUsers()
      return NextResponse.json(results);
    } catch (error: any) {
      console.log(error);
      return NextResponse.json(
        {
          message: error.message,
        },
        {
          status: 500,
        }
      );
    }
  }

export async function POST(req: NextRequest){
  return NextResponse.json({ error: 'User registration is handled via /api/auth/sign-up' }, { status: 410 });
}