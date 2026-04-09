import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getAuthToken } from "../auth/authStorage";
import { runtimeConfig } from "../config/runtimeConfig";

const httpLink = createHttpLink({
    uri: runtimeConfig.graphqlUrl
});

const authLink = setContext((_, { headers }) => {
    const token = getAuthToken();

    if (!token) {
        return { headers };
    }

    return {
        headers: {
            ...headers,
            authorization: `Bearer ${token}`
        }
    };
});

export const apolloClient = new ApolloClient({
    link: from([authLink, httpLink]),
    cache: new InMemoryCache()
});
