-- ============================================
-- Settings table — run in Supabase SQL Editor
-- Stores editable call sheet boilerplate + org defaults
-- Single row, keyed by id = 'global'
-- ============================================

create table if not exists settings (
  id            text primary key default 'global',
  updated_at    timestamptz default now(),
  -- Call sheet standard terms (editable)
  payment_terms text,
  further_bookings text,
  social_media  text,
  whs_terms     text,
  safety_link   text,
  -- Org defaults
  default_on_day_contact text
);

-- Seed the single global row with current defaults
insert into settings (id, payment_terms, further_bookings, social_media, whs_terms, safety_link, default_on_day_contact)
values (
  'global',
  'You need to have invoices in by 5pm Tuesdays to be included in the pay run on Wednesday morning, otherwise it will be included in the following week.
Invoice Byron Bay Experience by emailing to info@byronbayexperience.com.au.
Your invoice must say TAX INVOICE with your bank account details, ABN and performance date and whether you are registered for GST.',
  'To remain on the books, please do not give out your card and do not take any bookings direct from this client or venue. All enquiries as a result of this gig must be directed back via Byron Bay Experience.',
  'Please mention @byronbayexperience in any social media posts about this gig. Please never mention corporate companies or show any client logos in your posts as they request our confidentiality.
Please follow us on Instagram @byronbayexperience so we can follow you back and tag the correct account when posting about you.',
  'I agree to take responsibility to adhere to safety in the workplace.
I agree to conduct a risk assessment upon arrival to performance site and to take the necessary measures to ensure the safety of performers and audiences.
I confirm I hold a certificate of currency for Public Liability pertaining to all aspects of myself or group performance for $20,000,000.

Risk Assessments — Please be advised that you are to do a risk assessment of your work space and minimise hazards.
For musicians please ensure that all leads are duct taped to the floor, all liquids are away from electrical equipment, walkways are clear and if you are performing on a raised platform please enter and exit the stage in an appropriate manner. Please do not jump off any raised platforms.
For performers such as Circus, Stilts & Fire Acts please ensure that you familiarise yourself with your circuit prior to commencement of your performance for the night. Assess any risks and implement your risk minimisation strategies and please flag any issues that you have to your event coordinator.',
  'http://liveperformance.com.au/sites/liveperformance.com.au/files/resources/safety_guidelines_for_entertainment_industry_5_0.pdf',
  'Renee · 0403 769 229'
)
on conflict (id) do nothing;

alter table settings enable row level security;
create policy "team_access_settings" on settings
  for all using (auth.role() = 'authenticated');