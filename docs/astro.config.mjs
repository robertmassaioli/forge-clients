// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	// Required for GitHub Pages subpath deployment.
	// The site is served at https://rmassaioli.github.io/forge-clients/
	// Without these, all internal links and assets will 404.
	site: 'https://rmassaioli.github.io',
	base: '/forge-clients',

	integrations: [
		starlight({
			title: '@forge-clients',
			description: 'Type-safe Jira and Confluence REST API clients for Atlassian Forge apps.',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/rmassaioli/forge-clients',
				},
			],
			editLink: {
				baseUrl: 'https://github.com/rmassaioli/forge-clients/edit/main/docs/',
			},
			lastUpdated: true,
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Concepts', slug: 'getting-started/concepts' },
						{ label: 'Installation', slug: 'getting-started/installation' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Auth Contexts (asApp / asUser)', slug: 'guides/auth-contexts' },
						{ label: 'Error Handling', slug: 'guides/error-handling' },
						{ label: 'Pagination', slug: 'guides/pagination' },
						{ label: 'ForgeFunctionAdapter', slug: 'guides/forge-function-adapter' },
						{ label: 'ForgeBridgeAdapter', slug: 'guides/forge-bridge-adapter' },
						{ label: 'ForgeContainerAdapter', slug: 'guides/forge-container-adapter' },
					],
				},
				{
					label: 'Jira',
					items: [
						{ label: 'Overview', slug: 'jira/overview' },
						{ label: 'Issues', slug: 'jira/issues' },
						{ label: 'Projects', slug: 'jira/projects' },
						{ label: 'Users & Myself', slug: 'jira/users' },
						{ label: 'Search (JQL)', slug: 'jira/search' },
					],
				},
				{
					label: 'Confluence',
					items: [
						{ label: 'Overview', slug: 'confluence/overview' },
						{ label: 'Pages', slug: 'confluence/pages' },
						{ label: 'Spaces', slug: 'confluence/spaces' },
						{ label: 'Search (CQL)', slug: 'confluence/search' },
					],
				},
				{
					label: 'Generator',
					items: [
						{ label: 'Overview', slug: 'generator/overview' },
						{ label: 'Updating Specs', slug: 'generator/updating-specs' },
						{ label: 'Post-Processing Pipeline', slug: 'generator/post-processing' },
					],
				},
				{
					label: 'API Reference',
					autogenerate: { directory: 'reference' },
				},
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
