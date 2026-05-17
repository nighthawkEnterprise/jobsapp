import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { cookies } from "next/headers";

// We keep the real Auth0Client instantiated but wrap getSession to support our mock
const realAuth0 = new Auth0Client();

export const auth0 = {
  ...realAuth0,
  async getSession() {
    const cookieStore = await cookies();
    const isMockAuth = cookieStore.get('mock_auth_session');

    if (isMockAuth) {
      return {
        user: {
          name: "Mocked User",
          email: "prototype@example.com",
          nickname: "prototype",
          sub: "auth0|mocked123",
          picture: ""
        }
      };
    }

    // Fallback to real Auth0 logic if the mock cookie isn't present
    try {
      return await realAuth0.getSession();
    } catch {
      return null;
    }
  }
};
