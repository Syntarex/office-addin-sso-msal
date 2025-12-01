/// <reference types="astro/client" />

interface Window {
    Office: import("office-js");
}

declare namespace App {
    interface Locals {
        session: import("@/auth/models/session.model").Session;
    }
}
