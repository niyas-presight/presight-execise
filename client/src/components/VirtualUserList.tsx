import { useEffect, useRef } from "react";
import { Center, Loader, Text } from "@mantine/core";
import { useNetwork } from "@mantine/hooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, useReducedMotion } from "motion/react";

import { useResponsiveLanes } from "../state/useResponsiveLanes";
import type { ApiUser } from "../types/api";
import UserCard from "./UserCard";
import styles from "./VirtualUserList.module.scss";

interface VirtualUserListProps {
  users: ApiUser[];
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  fetchNextPage: () => Promise<unknown>;
}

const estimateSize = () => 180;
const overscan = 8;

interface NextPageState {
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  requestInFlight: boolean;
  lastVirtualIndex: number | undefined;
  loadedCount: number;
  isOnline: boolean;
}

export function shouldFetchNextPage(state: NextPageState): boolean {
  return (
    state.isOnline &&
    state.hasNextPage &&
    !state.isFetching &&
    !state.isFetchingNextPage &&
    !state.isFetchNextPageError &&
    !state.requestInFlight &&
    state.lastVirtualIndex !== undefined &&
    state.lastVirtualIndex >= state.loadedCount - overscan
  );
}

function VirtualUserList({
  users,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  isFetchNextPageError,
  fetchNextPage,
}: VirtualUserListProps) {
  const { ref, elementRef, lanes } = useResponsiveLanes();
  const reduceMotion = useReducedMotion();
  const requestInFlight = useRef(false);
  const { online: isOnline } = useNetwork();
  const canRenderNextPageLoader =
    hasNextPage && !isFetchNextPageError && isOnline;
  const virtualizer = useVirtualizer({
    count: users.length + Number(canRenderNextPageLoader),
    getScrollElement: () => elementRef.current,
    estimateSize,
    getItemKey: (index) => users[index]?.id ?? "next-page",
    overscan,
    lanes,
    gap: 8,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const lastVirtualIndex = virtualItems[virtualItems.length - 1]?.index;

  useEffect(() => {
    if (
      shouldFetchNextPage({
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        isFetchNextPageError,
        requestInFlight: requestInFlight.current,
        lastVirtualIndex,
        loadedCount: users.length,
        isOnline,
      })
    ) {
      requestInFlight.current = true;
      const releaseRequest = () => {
        requestInFlight.current = false;
      };
      void fetchNextPage().then(releaseRequest, releaseRequest);
    }
  }, [
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    lastVirtualIndex,
    users.length,
    isOnline,
  ]);

  return (
    <div
      ref={ref}
      className={styles.scrollParent}
      role="list"
      aria-label="Actor results"
      aria-busy={isFetchingNextPage}
      tabIndex={0}
    >
      <div
        className={styles.virtualItems}
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualItem) => {
          const position = {
            top: virtualItem.start,
            left: `${(virtualItem.lane * 100) / lanes}%`,
            width: `${100 / lanes}%`,
          };

          if (virtualItem.index >= users.length) {
            if (!canRenderNextPageLoader) {
              return null;
            }

            return (
              <Center
                key="next-page"
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                className={`${styles.item} ${styles.nextPageLoader}`}
                style={{ ...position, left: 0, width: "100%" }}
                role="status"
              >
                <Loader size="sm" aria-label="Loading more people" />
                <Text size="sm" c="dimmed" ml="sm">
                  Loading more people...
                </Text>
              </Center>
            );
          }

          const user = users[virtualItem.index];
          return (
            <motion.div
              key={user.id}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              className={`${styles.item} ${virtualItem.lane < lanes - 1 ? styles.gridItem : ""}`}
              style={position}
              role="listitem"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
            >
              <UserCard user={user} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualUserList;
