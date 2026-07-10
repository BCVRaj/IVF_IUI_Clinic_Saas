import { NextResponse } from "next/server";

// In a real application, this would query the hospital_settings table using Supabase.
// For this mockup, we return a static default configuration if it's not found in the DB.
const DEFAULT_SETTINGS = {
  hospital_name: "Apex IVF & Fertility Centre",
  logo_url: "https://via.placeholder.com/150x50.png?text=Apex+IVF",
  address_line_1: "123 Medical Parkway, Suite 400",
  address_line_2: "Metropolis, NY 10001",
  contact_phone: "+1 (555) 123-4567",
  contact_email: "lab@apex-ivf.com",
};

export async function GET(
  request: Request,
  { params }: { params: { hospitalId: string } }
) {
  try {
    const hospitalId = params.hospitalId || "default";

    // TODO: Fetch from Supabase
    // const { data, error } = await supabase.from('hospital_settings').select('*').eq('hospital_id', hospitalId).single();
    
    // Using mock data for demonstration
    const settings = {
      hospital_id: hospitalId,
      ...DEFAULT_SETTINGS,
    };

    return NextResponse.json({ data: settings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { hospitalId: string } }
) {
  try {
    const hospitalId = params.hospitalId;
    const body = await request.json();

    // TODO: Update in Supabase
    // const { data, error } = await supabase.from('hospital_settings').upsert({ hospital_id: hospitalId, ...body });

    return NextResponse.json({ data: body, message: "Settings updated successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
