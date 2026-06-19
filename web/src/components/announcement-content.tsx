"use client";

const urlPattern = /(https?:\/\/[^\s<>"']+)/g;
const exactUrlPattern = /^https?:\/\/[^\s<>"']+$/;

export function AnnouncementContent({ content }: { content: string }) {
    const parts = content.split(urlPattern);
    return (
        <>
            {parts.map((part, index) =>
                exactUrlPattern.test(part) ? (
                    <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer" className="break-all text-blue-600 hover:underline dark:text-blue-400">
                        {part}
                    </a>
                ) : (
                    <span key={`${part}-${index}`} className="whitespace-pre-wrap">
                        {part}
                    </span>
                ),
            )}
        </>
    );
}
