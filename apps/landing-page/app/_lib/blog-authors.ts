/*
 * Blog author registry.
 *
 * Authors are design for air *team personas* — recurring bylines attributed to the
 * team, NOT impersonations of independent outside experts. A post opts in via
 * the optional `author: <id>` frontmatter field; posts without it render no
 * byline (unchanged behaviour). Avatars are warm editorial portrait
 * illustrations under `/public/blog/authors/<id>.png`.
 */
export interface BlogAuthor {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
}

export const BLOG_AUTHORS: Record<string, BlogAuthor> = {
  'mira-zhao': {
    id: 'mira-zhao',
    name: 'Mira Zhao',
    role: 'Design Engineer, design for air',
    bio: 'Works on the design-to-code pipeline at design for air and writes about agentic design workflows.',
    avatar: '/blog/authors/mira-zhao.webp',
  },
  'theo-lindqvist': {
    id: 'theo-lindqvist',
    name: 'Theo Lindqvist',
    role: 'Product, design for air',
    bio: 'Product at design for air, focused on BYOK and the open plugin ecosystem.',
    avatar: '/blog/authors/theo-lindqvist.webp',
  },
  'nadia-haddad': {
    id: 'nadia-haddad',
    name: 'Nadia Haddad',
    role: 'Design Systems, design for air',
    bio: 'Works on design systems and developer experience at design for air.',
    avatar: '/blog/authors/nadia-haddad.webp',
  },
};

export function getBlogAuthor(id: string | undefined): BlogAuthor | undefined {
  return id ? BLOG_AUTHORS[id] : undefined;
}
