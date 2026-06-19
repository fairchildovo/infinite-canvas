import { useCallback, useEffect, useMemo, useState } from "react";
import localforage from "localforage";

import { fetchAnnouncements, type Announcement } from "@/services/api/announcements";

const store = localforage.createInstance({ name: "infinite-canvas", storeName: "announcement_reads" });

function readKey(userId: string, item: Announcement) {
    return `${userId || "anonymous"}:${item.id}:${item.updatedAt || item.createdAt || ""}`;
}

export function useAnnouncementNotices(userId?: string) {
    const [items, setItems] = useState<Announcement[]>([]);
    const [readKeys, setReadKeys] = useState<Set<string>>(new Set());
    const [readyReadScope, setReadyReadScope] = useState("");
    const identity = userId || "anonymous";
    const readScope = useMemo(() => `${identity}:${items.map((item) => `${item.id}:${item.updatedAt || item.createdAt || ""}`).join("|")}`, [identity, items]);

    const refresh = useCallback(async () => {
        const data = await fetchAnnouncements();
        setItems(data.filter((item) => item.placement === "notice"));
    }, []);

    useEffect(() => {
        void refresh().catch(() => {});
    }, [refresh]);

    useEffect(() => {
        let ignore = false;
        setReadyReadScope("");
        const loadReads = async () => {
            const pairs = await Promise.all(items.map(async (item) => [readKey(identity, item), await store.getItem<boolean>(readKey(identity, item))] as const));
            if (!ignore) {
                setReadKeys(new Set(pairs.filter(([, read]) => read).map(([key]) => key)));
                setReadyReadScope(readScope);
            }
        };
        void loadReads().catch(() => {
            if (!ignore) setReadyReadScope(readScope);
        });
        return () => {
            ignore = true;
        };
    }, [identity, items, readScope]);

    const readsReady = readyReadScope === readScope;
    const unreadItems = useMemo(() => (readsReady ? items.filter((item) => !readKeys.has(readKey(identity, item))) : []), [identity, items, readKeys, readsReady]);
    const popupItem = useMemo(() => unreadItems.find((item) => item.popup), [unreadItems]);

    const markRead = useCallback(
        async (targets: Announcement[]) => {
            const keys = targets.map((item) => readKey(identity, item));
            await Promise.all(keys.map((key) => store.setItem(key, true)));
            setReadKeys((current) => new Set([...current, ...keys]));
        },
        [identity],
    );

    return {
        items,
        unreadItems,
        popupItem,
        hasUnread: unreadItems.length > 0,
        readsReady,
        markRead,
        refresh,
    };
}
