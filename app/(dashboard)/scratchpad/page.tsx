import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScratchpadEditor } from "./scratchpad-editor";

export default async function ScratchpadPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const scratchpad = await prisma.scratchpad.upsert({
        where: { userId: session.user.id },
        update: {},
        create: { userId: session.user.id, content: "" },
    });

    return (
        <ScratchpadEditor
            initialContent={scratchpad.content}
            initialUpdatedAt={scratchpad.updatedAt.toISOString()}
            initialAutoSave={scratchpad.autoSave}
        />
    );
}
