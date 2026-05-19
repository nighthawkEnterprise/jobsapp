import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { cookies } from "next/headers";

const client = new Auth0Client({
  authorizationParameters: {
    scope: 'openid profile email',
  },
});

export const auth0 = {
  middleware: client.middleware.bind(client),
  getSession: async () => {
    if (process.env.NODE_ENV === 'development') {
      const cookieStore = await cookies();
      if (cookieStore.get('mock_auth_session')) {
        return {
          user: {
            name: 'Nithin Moorthy',
            email: 'nithinmoorthy11@gmail.com',
            nickname: 'nithin',
            sub: 'auth0|dev123',
            picture: '',
          },
        };
      }
    }
    try {
      return await client.getSession();
    } catch {
      return null;
    }
  },
};
