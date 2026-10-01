import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import type { UsersResponse } from "../types/api";
import VirtualUserList from "./VirtualUserList";
import styles from "./DirectoryStates.module.scss";

interface DirectoryStatesProps {
  query: UseInfiniteQueryResult<InfiniteData<UsersResponse>, Error>;
  listKey: string;
}

function DirectoryStates({ query, listKey }: DirectoryStatesProps) {
  const reduceMotion = useReducedMotion();

  if (query.isPending) {
    return (
      <Center className={styles.state}>
        <Stack align="center" gap="sm">
          <Loader size="sm" aria-label="Loading users" />
          <Text c="dimmed">Loading directory...</Text>
        </Stack>
      </Center>
    );
  }

  if (query.isError && !query.data) {
    return (
      <Center className={styles.state}>
        <Stack align="center" gap="xs">
          <Title order={3}>Directory unavailable</Title>
          <Text c="dimmed">{query.error.message}</Text>
          <Button variant="light" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </Stack>
      </Center>
    );
  }

  const users = query.data?.pages.flatMap((page) => page.data) ?? [];

  if (users.length === 0) {
    return (
      <Center className={styles.state}>
        <Stack align="center" gap="xs">
          <Title order={3}>No people found</Title>
          <Text c="dimmed">
            Try a different search or adjust the selected filters.
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <div className={styles.results}>
      {query.isError && (
        <Alert
          color="red"
          title={
            query.isFetchNextPageError
              ? "Could not load more people"
              : "Could not refresh results"
          }
          mb="sm"
        >
          <Group justify="space-between" align="center">
            <Text>{query.error.message}</Text>
            <Button
              variant="light"
              onClick={() =>
                void (query.isFetchNextPageError
                  ? query.fetchNextPage()
                  : query.refetch())
              }
            >
              Retry
            </Button>
          </Group>
        </Alert>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={listKey}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <VirtualUserList
            users={users}
            hasNextPage={Boolean(query.hasNextPage)}
            isFetching={query.isFetching}
            isFetchingNextPage={query.isFetchingNextPage}
            isFetchNextPageError={query.isFetchNextPageError}
            fetchNextPage={query.fetchNextPage}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default DirectoryStates;
