<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('support_topics', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category')->default('Download Content');
            $table->string('youtube_url', 1000)->nullable();
            $table->text('thumbnail')->nullable();
            $table->text('summary')->nullable();
            $table->longText('article_body')->nullable();
            $table->text('faq_question')->nullable();
            $table->text('faq_answer')->nullable();
            $table->unsignedBigInteger('views')->default(0);
            $table->unsignedBigInteger('helpful_count')->default(0);
            $table->enum('status', ['published', 'draft'])->default('published');
            $table->timestamps();
        });

        // Seed initial support video guides and articles into the database
        DB::table('support_topics')->insert([
            [
                'title' => 'How to Customise & Replace Marketing Content Assets',
                'category' => 'Customise Content',
                'youtube_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'thumbnail' => 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
                'summary' => 'Learn how to edit, update thumbnail images, and publish revised promotional banners.',
                'article_body' => "### Guide to Updating Content Assets:\n\n1. Navigate to **Content Center -> Upload Content**.\n2. Locate the asset card or table row you wish to modify.\n3. Click the **Edit (✏️)** button.\n4. Update the media file URL, title, tags, or connected entity association.\n5. Click **Save & Update Asset**.",
                'faq_question' => 'Will updated content immediately show on member panels?',
                'faq_answer' => 'Yes, as soon as status is set to Published, all members see the updated content.',
                'views' => 1420,
                'helpful_count' => 380,
                'status' => 'published',
                'created_at' => now()->subDays(10),
                'updated_at' => now()->subDays(10),
            ],
            [
                'title' => '1-Click WhatsApp & Social Share Content Tutorial',
                'category' => 'Share Content',
                'youtube_url' => 'https://www.youtube.com/embed/L_LUpnjgPso',
                'thumbnail' => 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500',
                'summary' => 'Detailed video guide on sharing promotional banners, promo videos, and PDF flyers on WhatsApp.',
                'article_body' => "### How to Share Content with your Business Leads:\n\n1. Open **Contents -> Content Support** or **Media Library**.\n2. Click the **📲 Share** button on any marketing banner or video.\n3. Choose **WhatsApp Direct Share** or **Copy Link**.\n4. Send the personalized marketing link to your clients.",
                'faq_question' => 'Does sharing content track my referral link?',
                'faq_answer' => 'Yes! Shared links automatically attach your affiliate referral tracking parameter.',
                'views' => 1890,
                'helpful_count' => 520,
                'status' => 'published',
                'created_at' => now()->subDays(8),
                'updated_at' => now()->subDays(8),
            ],
            [
                'title' => 'Downloading High-Res Banners, Videos & Audio Jingles',
                'category' => 'Download Content',
                'youtube_url' => 'https://www.youtube.com/embed/M7lc1UVf-VE',
                'thumbnail' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
                'summary' => 'Walkthrough on downloading high-resolution marketing graphics, MP4 videos, and audio tracks to phone/PC.',
                'article_body' => "### Direct Content Downloading Steps:\n\n1. Select any media file card in your showcase.\n2. Click **📥 Download**.\n3. The asset will immediately save to your local Downloads folder in original HD quality.",
                'faq_question' => 'Are there any limits on daily content downloads?',
                'faq_answer' => 'No, active members can download unlimited marketing materials daily.',
                'views' => 2150,
                'helpful_count' => 610,
                'status' => 'published',
                'created_at' => now()->subDays(6),
                'updated_at' => now()->subDays(6),
            ],
            [
                'title' => 'Connecting Content Assets with Business & Freelance Entities',
                'category' => 'Entity Content',
                'youtube_url' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'thumbnail' => 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500',
                'summary' => 'How to tag media assets to a Registered Business, Freelancer profile, or Vyapar Adnet Official system.',
                'article_body' => "### Entity Connection Workflow:\n\n1. During content upload, select **Connected Entity Type**:\n   - Registered Business\n   - Freelance Entity\n   - Vyapar Adnet Official System\n2. Enter or select the entity name to tag the owner brand.",
                'faq_question' => 'Can freelancers upload custom branded showreels?',
                'faq_answer' => 'Yes, select Freelancer Entity and attach your freelancer registration handle.',
                'views' => 940,
                'helpful_count' => 290,
                'status' => 'published',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_topics');
    }
};
