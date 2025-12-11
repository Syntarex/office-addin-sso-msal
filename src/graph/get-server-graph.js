import "@pnp/graph/presets/all";

import { graphfi } from "@pnp/graph";
import { GraphDefault } from "@pnp/nodejs";
import { BearerToken } from "@pnp/queryable";

export function getServerGraph(accessToken) {
    return graphfi().using(
        GraphDefault({
            baseUrl: "https://graph.microsoft.com/v1.0",
        }),
        BearerToken(accessToken),
    );
}
