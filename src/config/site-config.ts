/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const siteConfig = {
  name: "ALT Business Connections",
  shortName: "A.B.C",
  description: "High-end, community-focused business networking.",
  theme: {
    colors: {
      sage: "#9CAF88",
      sand: "#E6D5B8",
      forest: "#2D4030",
      paper: "#FDFCF9",
      ink: "#1F2421",
    },
  },
  links: {
    home: "/",
    adminVerify: "/admin/verify",
  },
};

export type SiteConfig = typeof siteConfig;
