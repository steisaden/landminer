import { json } from '../_shared/http';

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({} as any));
    const address = body?.address;

    if (!address) {
      return json({ success: false, error: 'Address required' }, { status: 400 });
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockNames = ['James Mitchell', 'Maria Gonzalez', 'Robert Chen', 'Sarah Williams', 'David Rodriguez', 'Jennifer Smith'];
    const hash = String(address).length;
    const ownerName = mockNames[hash % mockNames.length];
    const areaCode = '555';
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const phone = `(${areaCode}) 555-${suffix}`;

    if (Math.random() < 0.1) {
      return json({ success: false, error: 'No records found for this property' });
    }

    return json({
      success: true,
      data: {
        ownerName,
        phone,
        status: 'verified',
      },
    });
  } catch (error: any) {
    return json({ success: false, error: error?.message || 'Failed to process skip trace' }, { status: 500 });
  }
};
