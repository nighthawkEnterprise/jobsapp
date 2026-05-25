<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>ApplyOS | Resume Tailoring</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Hanken+Grotesk:wght@600;700;800&amp;family=JetBrains+Mono:wght@500&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-secondary": "#ffffff",
                        "tertiary-container": "#a33500",
                        "tertiary-fixed": "#ffdbcf",
                        "error-container": "#ffdad6",
                        "secondary-container": "#c4e0fe",
                        "outline-variant": "#c3c6d6",
                        "on-tertiary-container": "#ffc6b2",
                        "on-secondary-fixed": "#001d32",
                        "secondary-fixed": "#cee5ff",
                        "on-secondary-container": "#48637d",
                        "on-primary-fixed": "#001848",
                        "surface-tint": "#0c56d0",
                        "primary-container": "#0052cc",
                        "on-primary": "#ffffff",
                        "on-surface-variant": "#434654",
                        "surface-container-highest": "#d1e4ff",
                        "surface-bright": "#f8f9ff",
                        "surface-container-high": "#dbe9ff",
                        "on-tertiary-fixed-variant": "#812800",
                        "on-primary-fixed-variant": "#0040a2",
                        "primary-fixed-dim": "#b2c5ff",
                        "on-error": "#ffffff",
                        "primary-fixed": "#dae2ff",
                        "on-tertiary-fixed": "#380d00",
                        "error": "#ba1a1a",
                        "on-error-container": "#93000a",
                        "inverse-on-surface": "#e9f1ff",
                        "background": "#f8f9ff",
                        "tertiary-fixed-dim": "#ffb59b",
                        "surface-variant": "#d1e4ff",
                        "surface-dim": "#c4dcfd",
                        "on-background": "#011d35",
                        "outline": "#737685",
                        "tertiary": "#7b2600",
                        "inverse-surface": "#19324b",
                        "on-surface": "#011d35",
                        "on-primary-container": "#c4d2ff",
                        "surface-container-lowest": "#ffffff",
                        "secondary-fixed-dim": "#aec9e7",
                        "surface-container": "#e4efff",
                        "secondary": "#46617b",
                        "on-secondary-fixed-variant": "#2e4962",
                        "inverse-primary": "#b2c5ff",
                        "primary": "#003d9b",
                        "on-tertiary": "#ffffff",
                        "surface-container-low": "#eef4ff",
                        "surface": "#f8f9ff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "spacing": {
                        "gutter": "24px",
                        "margin-mobile": "16px",
                        "container-max": "1440px",
                        "base": "8px",
                        "margin-desktop": "40px"
                    },
                    "fontFamily": {
                        "label-md": ["JetBrains Mono"],
                        "headline-lg": ["Hanken Grotesk"],
                        "headline-lg-mobile": ["Hanken Grotesk"],
                        "body-sm": ["Inter"],
                        "body-md": ["Inter"],
                        "body-lg": ["Inter"],
                        "headline-xl": ["Hanken Grotesk"],
                        "headline-md": ["Hanken Grotesk"]
                    },
                    "fontSize": {
                        "label-md": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "500"}],
                        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                        "headline-lg-mobile": ["28px", {"lineHeight": "36px", "fontWeight": "600"}],
                        "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                        "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                        "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                        "headline-xl": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                        "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}]
                    }
                }
            }
        }
    </script>
<style>
        .editor-grid {
            background-image: linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px);
            background-size: 20px 20px;
        }
        .fit-score-gauge {
            background: conic-gradient(from 180deg at 50% 50%, #003d9b 0deg, #003d9b 345deg, #e2e8f0 345deg);
        }
        .resume-page {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            width: 8.5in;
            min-height: 11in;
            margin: 0 auto;
            background: white;
            padding: 0.75in;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    </style>
</head>
<body class="bg-background text-on-surface font-body-md min-h-screen flex flex-col">
<!-- TopNavBar -->
<nav class="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-50">
<div class="flex justify-between items-center w-full px-margin-desktop py-4 max-w-container-max mx-auto">
<div class="flex items-center gap-8">
<span class="text-headline-md font-headline-md font-bold text-primary">ApplyOS</span>
<div class="hidden md:flex items-center gap-6">
<a class="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-md" href="#">Dashboard</a>
<a class="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-md" href="#">Scan</a>
<a class="text-primary font-bold border-b-2 border-primary pb-1 font-body-md" href="#">Pipeline</a>
<a class="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-md" href="#">Resumes</a>
<a class="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-md" href="#">Stories</a>
<a class="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-md" href="#">Settings</a>
</div>
</div>
<div class="flex items-center gap-4">
<div class="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-bold text-xs" title="User avatar for NI">NI</div>
<button class="text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">logout</span>
</button>
</div>
</div>
</nav>
<!-- Header / Job Details -->
<header class="bg-white border-b border-outline-variant shadow-sm px-margin-desktop py-6">
<div class="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
<div>
<a class="flex items-center gap-2 text-primary text-body-sm mb-2 hover:underline" href="#">
<span class="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Pipeline
                </a>
<h1 class="text-headline-lg font-headline-lg text-on-surface">Staff Product Manager, Serverless Workspaces</h1>
<div class="flex flex-wrap items-center gap-3 mt-2">
<span class="text-body-md font-medium text-secondary">Databricks</span>
<span class="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
<span class="text-body-md text-on-surface-variant">Seattle, Washington</span>
<div class="flex items-center gap-2 ml-4">
<span class="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-md">Status: Interested</span>
</div>
</div>
</div>
<div class="flex items-center gap-6 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
<div class="flex flex-col items-center">
<div class="relative w-16 h-16 flex items-center justify-center">
<div class="absolute inset-0 rounded-full border-4 border-surface-container-highest"></div>
<div class="absolute inset-0 rounded-full border-4 border-primary border-r-transparent border-b-transparent transform rotate-[45deg]"></div>
<span class="text-headline-md font-bold text-primary">4.8</span>
</div>
<span class="text-label-md mt-1 text-on-surface-variant">FIT SCORE</span>
</div>
<div class="h-10 w-px bg-outline-variant"></div>
<div class="flex flex-col">
<span class="text-label-md text-on-surface-variant">MATCH STRENGTH</span>
<span class="text-body-md font-bold text-on-surface">Excellent</span>
</div>
</div>
</div>
</header>
<!-- Workspace -->
<main class="flex-grow grid grid-cols-1 lg:grid-cols-[400px_1fr] overflow-hidden">
<!-- Left Panel: Context & Strategy -->
<aside class="bg-white border-r border-outline-variant flex flex-col h-[calc(100vh-180px)]">
<div class="flex border-b border-outline-variant">
<button class="flex-1 py-4 text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">JOB DESCRIPTION</button>
<button class="flex-1 py-4 text-label-md font-bold text-primary border-b-2 border-primary">TAILOR STRATEGY</button>
<button class="flex-1 py-4 text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors">COMPETENCY GAPS</button>
</div>
<div class="flex-grow overflow-y-auto p-6 space-y-8">
<!-- Action -->
<div>
<button class="w-full bg-primary text-on-primary py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-md">
<span class="material-symbols-outlined">auto_fix_high</span>
                        Generate Tailored Resume
                    </button>
<p class="text-body-sm text-on-surface-variant mt-3 italic text-center">
                        Uses GPT-4 to align your experience with job requirements.
                    </p>
</div>
<!-- Strategy Section -->
<section>
<h3 class="text-label-md font-bold text-on-surface mb-4 flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-lg">lightbulb</span>
                        STRATEGY
                    </h3>
<div class="bg-surface-container-low p-4 rounded-lg border-l-4 border-primary">
<p class="text-body-sm text-on-surface leading-relaxed">
                            The resume was reframed around Databricks' core themes: platform simplification, serverless onboarding, and identity infrastructure.
                        </p>
<ul class="mt-4 space-y-3">
<li class="flex gap-3">
<span class="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
<span class="text-body-sm">Highlighted multi-tenant provisioning from your Okta experience.</span>
</li>
<li class="flex gap-3">
<span class="material-symbols-outlined text-primary text-sm mt-1">check_circle</span>
<span class="text-body-sm">Elevated IAM and OIDC bullets to align with "Secure-by-default" pillars.</span>
</li>
</ul>
</div>
</section>
<!-- Keywords -->
<section>
<h3 class="text-label-md font-bold text-on-surface mb-4 flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-lg">vpn_key</span>
                        KEY KEYWORDS TO ADD
                    </h3>
<div class="flex flex-wrap gap-2">
<span class="px-2 py-1 bg-secondary-container text-on-secondary-container rounded text-label-md border border-outline-variant">OIDC</span>
<span class="px-2 py-1 bg-secondary-container text-on-secondary-container rounded text-label-md border border-outline-variant">IAM</span>
<span class="px-2 py-1 bg-secondary-container text-on-secondary-container rounded text-label-md border border-outline-variant">Multi-tenant</span>
<span class="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded text-label-md border border-outline-variant">Serverless SDK</span>
<span class="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded text-label-md border border-outline-variant">Developer UX</span>
</div>
</section>
<!-- Stats -->
<div class="pt-6 border-t border-outline-variant">
<div class="flex justify-between items-center mb-2">
<span class="text-label-md text-on-surface-variant">Tailoring Completion</span>
<span class="text-label-md font-bold text-primary">85%</span>
</div>
<div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
<div class="bg-primary h-full w-[85%]"></div>
</div>
</div>
</div>
<div class="p-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
<button class="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-body-sm">
<span class="material-symbols-outlined text-sm">download</span>
                    Export PDF
                </button>
<button class="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-body-sm">
<span class="material-symbols-outlined text-sm">share</span>
                    Share Link
                </button>
</div>
</aside>
<!-- Right Panel: Resume Editor -->
<section class="bg-surface-container-low editor-grid relative overflow-hidden flex flex-col h-[calc(100vh-180px)]">
<!-- Toolbar -->
<div class="bg-white border-b border-outline-variant px-8 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
<div class="flex items-center gap-4">
<div class="flex items-center bg-surface-container-low rounded-lg p-1 border border-outline-variant">
<button class="p-2 hover:bg-white rounded transition-all"><span class="material-symbols-outlined text-lg">format_bold</span></button>
<button class="p-2 hover:bg-white rounded transition-all"><span class="material-symbols-outlined text-lg">format_italic</span></button>
<button class="p-2 hover:bg-white rounded transition-all"><span class="material-symbols-outlined text-lg">format_list_bulleted</span></button>
</div>
<div class="h-6 w-px bg-outline-variant"></div>
<button class="flex items-center gap-2 px-3 py-1.5 border border-primary text-primary rounded-lg hover:bg-primary-container hover:text-on-primary transition-all text-body-sm font-medium">
<span class="material-symbols-outlined text-sm">auto_awesome</span>
                        AI Assistant
                    </button>
</div>
<div class="flex items-center gap-3">
<span class="text-body-sm text-on-surface-variant italic">Saving...</span>
<button class="p-2 text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined">zoom_out</span></button>
<span class="text-label-md text-on-surface-variant">100%</span>
<button class="p-2 text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined">zoom_in</span></button>
</div>
</div>
<!-- Content Area -->
<div class="flex-grow overflow-y-auto p-12 relative">
<!-- Resume Document -->
<article class="resume-page relative text-[#1e293b]">
<header class="text-center mb-12">
<h2 class="text-[32px] font-bold tracking-tight mb-2 uppercase">Nithin Moorthy</h2>
<div class="text-[13px] flex justify-center gap-3 text-secondary">
<span>Greater Seattle Area</span>
<span>•</span>
<span>nithinmoorthy11@gmail.com</span>
<span>•</span>
<span>LinkedIn</span>
<span>•</span>
<span>GitHub</span>
</div>
</header>
<section class="mb-8">
<h3 class="text-[14px] font-bold border-b border-[#cbd5e1] mb-3 pb-1 uppercase tracking-wider text-[#475569]">Professional Summary</h3>
<p class="text-[13px] leading-relaxed">
                            Technical Product Manager with a software engineering background and 5+ years at Auth0/Okta building developer-facing platforms, onboarding experiences, and secure-by-default infrastructure at enterprise scale. Proven track record of simplifying complex technical workflows into low-friction, guided experiences.
                        </p>
</section>
<section class="mb-8">
<h3 class="text-[14px] font-bold border-b border-[#cbd5e1] mb-3 pb-1 uppercase tracking-wider text-[#475569]">Experience</h3>
<div class="mb-6">
<div class="flex justify-between items-baseline mb-1">
<span class="font-bold text-[14px]">Okta (Customer Identity Cloud / Auth0)</span>
<span class="text-[12px] italic">2019 – Present</span>
</div>
<div class="flex justify-between items-baseline mb-2">
<span class="italic text-[13px]">Senior Product Manager</span>
<span class="text-[12px]">Seattle, WA</span>
</div>
<ul class="list-disc ml-5 text-[13px] space-y-2">
<li class="relative">
<span class="bg-yellow-50 border-b-2 border-yellow-200">Spearheaded the design and rollout of multi-tenant provisioning systems</span>, reducing customer onboarding time for enterprise organizations by 45% through platform simplification.
                                    <!-- AI Suggestion in Margin -->
<div class="absolute -right-[220px] top-0 w-[180px] bg-white border border-primary/20 shadow-lg p-3 rounded-lg z-20 text-[11px] leading-tight">
<div class="flex items-center gap-1 text-primary font-bold mb-1">
<span class="material-symbols-outlined text-[12px]">auto_awesome</span> AI Suggestion
                                        </div>
                                        Matched: "Serverless onboarding".
                                        <div class="mt-2 text-on-surface-variant italic">Reframed to emphasize automation and scale.</div>
</div>
</li>
<li>Architected the developer experience for OIDC-compliant identity layers, supporting 10M+ daily active tokens across global serverless environments.</li>
<li class="relative">
                                    Led cross-functional teams to implement <span class="bg-blue-50 border-b-2 border-blue-200">IAM governance at scale</span>, ensuring secure-by-default configurations for 500+ Fortune 1000 customers.
                                    <div class="absolute -right-[220px] top-0 w-[180px] bg-white border border-primary/20 shadow-lg p-3 rounded-lg z-20 text-[11px] leading-tight">
<div class="flex items-center gap-1 text-primary font-bold mb-1">
<span class="material-symbols-outlined text-[12px]">auto_awesome</span> AI Suggestion
                                        </div>
                                        Matched: "Identity infrastructure".
                                        <div class="mt-2 text-on-surface-variant italic">Added 'governance' to align with JD.</div>
</div>
</li>
</ul>
</div>
</section>
<section class="mb-8">
<h3 class="text-[14px] font-bold border-b border-[#cbd5e1] mb-3 pb-1 uppercase tracking-wider text-[#475569]">Skills</h3>
<div class="grid grid-cols-2 gap-x-12 gap-y-1 text-[13px]">
<div><span class="font-bold">Protocols:</span> OIDC, OAuth 2.0, SAML, JWT</div>
<div><span class="font-bold">Cloud:</span> AWS, Azure, Serverless, Docker</div>
<div><span class="font-bold">Identity:</span> IAM, RBAC, Multi-tenancy, AuthZ</div>
<div><span class="font-bold">Methodology:</span> Agile, CI/CD, Product-Led Growth</div>
</div>
</section>
</article>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-surface-container-low border-t border-outline-variant">
<div class="flex justify-between items-center w-full px-margin-desktop py-8 max-w-container-max mx-auto">
<span class="text-label-md font-label-md font-bold text-secondary">ApplyOS</span>
<span class="text-body-sm text-secondary font-body-sm">© 2024 ApplyOS. All rights reserved.</span>
<div class="flex gap-6">
<a class="text-secondary hover:text-primary transition-colors text-body-sm font-body-sm" href="#">Privacy Policy</a>
<a class="text-secondary hover:text-primary transition-colors text-body-sm font-body-sm" href="#">Terms of Service</a>
<a class="text-secondary hover:text-primary transition-colors text-body-sm font-body-sm" href="#">Support</a>
</div>
</div>
</footer>
<script>
        // Micro-interactions
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function() {
                this.classList.add('scale-95');
                setTimeout(() => this.classList.remove('scale-95'), 100);
            });
        });
    </script>
</body></html>