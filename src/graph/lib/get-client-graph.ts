import "@pnp/graph/presets/all";

import { GraphBrowser, graphfi } from "@pnp/graph";
import { BearerToken } from "@pnp/queryable";

export function getClientGraph(accessToken: string) {
    return graphfi().using(
        GraphBrowser({
            baseUrl: "https://graph.microsoft.com/v1.0",
        }),
        BearerToken(accessToken),
    );
}
