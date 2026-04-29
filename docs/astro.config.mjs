// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';

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
			plugins: [
				starlightTypeDoc({
					// Generate API reference from @forge-clients/core only.
					// jira/confluence have 1500+ generated functions — too large for reference docs.
					// Generator package is internal tooling — not relevant to consumers.
					entryPoints: [
						'../packages/core/src/index.ts',
					],
					tsconfig: '../packages/core/tsconfig.json',
					typedoc: {
						entryPointStrategy: 'expand',
						excludePrivate: true,
						excludeInternal: true,
						excludeExternals: true,
						plugin: ['typedoc-plugin-markdown'],
						readme: 'none',
						sort: ['source-order'],
						groupOrder: ['Functions', 'Classes', 'Interfaces', 'Type Aliases', 'Variables'],
						parametersFormat: 'table',
						propertiesFormat: 'table',
						enumMembersFormat: 'table',
					},
					sidebar: {
						label: 'API Reference (@forge-clients/core)',
						collapsed: false,
					},
					output: 'reference',
				}),
			],
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
						{ label: 'ForgeRemoteAdapter', slug: 'guides/forge-remote-adapter' },
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
				typeDocSidebarGroup,
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
