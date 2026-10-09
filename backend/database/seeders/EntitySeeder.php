<?php

namespace Database\Seeders;

use App\Models\EntityCategory;
use App\Models\BusinessEntity;
use App\Models\FreelancerEntity;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EntitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Business Categories
        $categoriesData = [
            [
                'name' => 'Taxation & Accounting',
                'description' => 'GST Registration, ITR Filing, Audit & Bookkeeping Services',
                'icon' => 'calculator',
                'badge_color' => '#6366f1',
            ],
            [
                'name' => 'Legal & Corporate Services',
                'description' => 'Company Registration, Trademark, Patents & Legal Documentation',
                'icon' => 'scale',
                'badge_color' => '#8b5cf6',
            ],
            [
                'name' => 'IT & Software Development',
                'description' => 'Web Apps, Mobile Apps, Cloud Services & Custom Software Solutions',
                'icon' => 'code',
                'badge_color' => '#3b82f6',
            ],
            [
                'name' => 'Digital Marketing & Ads',
                'description' => 'SEO, Social Media Marketing, PPC Ads & Brand Growth',
                'icon' => 'trending-up',
                'badge_color' => '#ec4899',
            ],
            [
                'name' => 'Financial Consulting',
                'description' => 'Business Loans, Venture Funding, Wealth Management & Valuation',
                'icon' => 'dollar-sign',
                'badge_color' => '#10b981',
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[] = EntityCategory::firstOrCreate(
                ['slug' => Str::slug($c['name'])],
                [
                    'name' => $c['name'],
                    'description' => $c['description'],
                    'icon' => $c['icon'],
                    'badge_color' => $c['badge_color'],
                    'status' => 'active',
                ]
            );
        }

        $taxCat = $categories[0];
        $legalCat = $categories[1];
        $itCat = $categories[2];
        $marketingCat = $categories[3];

        // 2. Create Registered Businesses under Categories
        $businesses = [
            [
                'entity_category_id' => $taxCat->id,
                'name' => 'Apex Financial Advisory Pvt Ltd',
                'owner_name' => 'Rajesh Sharma',
                'email' => 'contact@apexfinance.in',
                'phone' => '+91 98765 43210',
                'address' => 'Suite 402, Business Tower, Connaught Place, New Delhi',
                'registration_no' => 'GSTIN07AAACA1234F1Z5',
                'description' => 'Premier Tax Consulting firm specializing in Corporate Tax, GST filings, and Startup Audit compliance.',
                'logo_url' => 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&auto=format&fit=crop&q=80',
                'website' => 'https://apexfinance.example.com',
                'verification_status' => 'verified',
                'featured' => true,
                'documents' => [
                    [
                        'title' => 'GST Registration Certificate',
                        'file_name' => 'gst_apex_certificate.pdf',
                        'url' => 'https://via.placeholder.com/400x300?text=GST+Certificate+Verified',
                        'status' => 'verified',
                    ],
                    [
                        'title' => 'Certificate of Incorporation (ROC)',
                        'file_name' => 'roc_incorporation.pdf',
                        'url' => 'https://via.placeholder.com/400x300?text=ROC+Incorporation+Doc',
                        'status' => 'verified',
                    ],
                    [
                        'title' => 'Company PAN Card',
                        'file_name' => 'company_pan.pdf',
                        'url' => 'https://via.placeholder.com/400x300?text=Company+PAN+Card',
                        'status' => 'verified',
                    ],
                ],
            ],
            [
                'entity_category_id' => $legalCat->id,
                'name' => 'LexJuris Legal Associates',
                'owner_name' => 'Adv. Priya Malhotra',
                'email' => 'info@lexjurislegal.com',
                'phone' => '+91 98112 34567',
                'address' => '7th Floor, Cyber Park, Sector 44, Gurugram',
                'registration_no' => 'BAR-DEL-2015-884',
                'description' => 'Specialized Bar Council registered attorneys offering Intellectual Property, Contract Drafting, and M&A legal advisory.',
                'logo_url' => 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&auto=format&fit=crop&q=80',
                'website' => 'https://lexjurislegal.example.com',
                'verification_status' => 'verified',
                'featured' => true,
                'documents' => [
                    [
                        'title' => 'Bar Council License',
                        'file_name' => 'bar_council_license.pdf',
                        'url' => 'https://via.placeholder.com/400x300?text=Bar+Council+License',
                        'status' => 'verified',
                    ],
                    [
                        'title' => 'Firm Registration Certificate',
                        'file_name' => 'firm_registration.pdf',
                        'url' => 'https://via.placeholder.com/400x300?text=Firm+Registration',
                        'status' => 'verified',
                    ],
                ],
            ],
            [
                'entity_category_id' => $itCat->id,
                'name' => 'CloudScale Web Tech Solutions',
                'owner_name' => 'Amitabh Verma',
                'email' => 'sales@cloudscaletech.com',
                'phone' => '+91 99001 12233',
                'address' => 'Building 4, Electronic City Phase 1, Bengaluru',
                'registration_no' => 'UDYAM-KR-03-0091234',
                'description' => 'Full-cycle enterprise software development, SaaS products, Laravel API architectures, and AI integrations.',
                'logo_url' => 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop&q=80',
                'website' => 'https://cloudscale.example.com',
                'verification_status' => 'verified',
                'featured' => true,
                'documents' => [
                    [
                        'title' => 'MSME / Udyam Registration Certificate',
                        'file_name' => 'udyam_certificate.pdf',
                        'url' => 'https://via.placeholder.com/400x300?text=Udyam+MSME+Certificate',
                        'status' => 'verified',
                    ],
                    [
                        'title' => 'ISO 27001 Security Certificate',
                        'file_name' => 'iso_27001.pdf',
                        'url' => 'https://via.placeholder.com/400x300?text=ISO+27001+Cert',
                        'status' => 'verified',
                    ],
                ],
            ],
        ];

        foreach ($businesses as $b) {
            BusinessEntity::firstOrCreate(
                ['email' => $b['email']],
                $b
            );
        }

        // 3. Create Registered Freelancers under Categories
        $freelancers = [
            [
                'entity_category_id' => $itCat->id,
                'name' => 'Rohan Sen',
                'email' => 'rohan.dev@gmail.com',
                'phone' => '+91 97766 55443',
                'title' => 'Senior React & Laravel Developer',
                'experience_years' => 6,
                'hourly_rate' => '₹1,200/hr',
                'bio' => 'Full-stack software architect specializing in React, Next.js, Laravel REST APIs, Tailwind CSS, and scalable cloud platforms.',
                'avatar_url' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
                'portfolio_link' => 'https://rohansendev.example.com',
                'verification_status' => 'verified',
                'featured' => true,
                'documents' => [
                    [
                        'title' => 'Government ID Proof (Aadhaar Card)',
                        'file_name' => 'aadhaar_card_rohan.pdf',
                        'url' => 'https://via.placeholder.com/400x300?text=Aadhaar+ID+Verified',
                        'status' => 'verified',
                    ],
                    [
                        'title' => 'AWS Certified Solutions Architect',
                        'file_name' => 'aws_certificate.pdf',
                        'url' => 'https://via.placeholder.com/400x300?text=AWS+Architect+Certificate',
                        'status' => 'verified',
                    ],
                ],
            ],
            [
                'entity_category_id' => $marketingCat->id,
                'name' => 'Sneha Kapoor',
                'email' => 'sneha.growth@gmail.com',
                'phone' => '+91 98877 66554',
                'title' => 'Performance Marketing & SEO Strategist',
                'experience_years' => 5,
                'hourly_rate' => '₹950/hr',
                'bio' => 'Data-driven Growth Marketer managing high ROI Meta Ads, Google PPC campaigns, and Technical SEO for D2C & B2B brands.',
                'avatar_url' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
                'portfolio_link' => 'https://snehagrowth.example.com',
                'verification_status' => 'verified',
                'featured' => true,
                'documents' => [
                    [
                        'title' => 'Government ID Proof (PAN Card)',
                        'file_name' => 'pan_card_sneha.pdf',
                        'url' => 'https://via.placeholder.com/400x300?text=PAN+Card+Verified',
                        'status' => 'verified',
                    ],
                    [
                        'title' => 'Google Ads & Analytics Certified Professional',
                        'file_name' => 'google_analytics_cert.pdf',
                        'url' => 'https://via.placeholder.com/400x300?text=Google+Ads+Certified',
                        'status' => 'verified',
                    ],
                ],
            ],
        ];

        foreach ($freelancers as $f) {
            FreelancerEntity::firstOrCreate(
                ['email' => $f['email']],
                $f
            );
        }
    }
}
