declare namespace App {
    interface Locals {
        session: import("@/auth/models/session.model").Session;
        graph: import("@pnp/graph").GraphFI;
    }
}
