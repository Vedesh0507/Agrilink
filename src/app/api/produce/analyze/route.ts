import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, authorizeRoles } from '@/lib/auth';
import { ProduceAnalysisRequestSchema } from '@/validators';
import { getProduceVisionProvider } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { error, context } = await authenticateUser(req);
    if (error) return error;

    const currentUser = context!.user;
    if (!authorizeRoles(currentUser, ['FARMER', 'ADMIN'])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only farmers and administrators can run visual quality analysis.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = ProduceAnalysisRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid image analysis request payload',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { images, farmerCropName } = validation.data;

    const provider = getProduceVisionProvider();
    const result = await provider.analyzeProduceLot({
      images,
      farmerCropName,
      additionalNotes: body.additionalNotes,
    });

    if (!result.success || !result.assessment) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'AI visual assessment could not be completed.',
          disclaimer: result.disclaimer,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        assessment: result.assessment,
        disclaimer: result.disclaimer,
      },
    });
  } catch (err: any) {
    console.error('Produce visual analysis error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'An unexpected error occurred during produce visual analysis.',
      },
      { status: 500 }
    );
  }
}
