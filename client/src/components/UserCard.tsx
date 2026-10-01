import {
  Avatar,
  Badge,
  Group,
  OverflowList,
  Paper,
  Stack,
  Text,
  useComputedColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { Avatar as DiceBearAvatar, Style } from "@dicebear/core";
import lorelei from "@dicebear/styles/lorelei.json";
import waves from "@dicebear/styles/waves.json";
import { useMemo, type CSSProperties } from "react";

import type { ApiUser } from "../types/api";
import styles from "./UserCard.module.scss";

const loreleiStyle = new Style(lorelei);
const patternStyle = new Style(waves);
const hex = (color: string) => color.replace("#", "");

const flagCodes: Record<string, string> = {
  American: "us",
  Australian: "au",
  British: "gb",
  Canadian: "ca",
  Chilean: "cl",
  Chinese: "cn",
  Colombian: "co",
  Danish: "dk",
  French: "fr",
  Icelandic: "is",
  Indian: "in",
  Irish: "ie",
  Italian: "it",
  Japanese: "jp",
  Kenyan: "ke",
  Mexican: "mx",
  Moroccan: "ma",
  "New Zealander": "nz",
  Nigerian: "ng",
  Scottish: "gb-sct",
  "South African": "za",
  "South Korean": "kr",
  Spanish: "es",
  Swedish: "se",
  Welsh: "gb-wls",
};

interface UserCardProps {
  user: ApiUser;
}

function UserCard({ user }: UserCardProps) {
  const name = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`;
  const flagCode = flagCodes[user.nationality];
  const theme = useMantineTheme();
  const palette = theme.colors[theme.primaryColor];
  const isDark = useComputedColorScheme("light") === "dark";
  const avatarSrc = useMemo(
    () =>
      new DiceBearAvatar(loreleiStyle, {
        seed: String(user.id),
        backgroundColor: [palette[0], palette[1], palette[2]].map(hex),
        hairColor: [palette[7], palette[8], palette[9]].map(hex),
        outlineColor: [hex(palette[9])],
      }).toDataUri(),
    [user.id, palette],
  );
  const [patternSrc, animatedPatternSrc] = useMemo(() => {
    const options = {
      seed: String(user.id),
      // Transparent so waves sit on the card surface in every palette.
      backgroundColor: [],
      waveColor: (isDark
        ? [palette[6], palette[7], palette[8]]
          : [palette[2], palette[3], palette[4]]
      ).map(hex),
    };
    return [
      new DiceBearAvatar(patternStyle, options).toDataUri(),
      new DiceBearAvatar(patternStyle, {
        ...options,
        animationVariant: "fastest",
      }).toDataUri(),
    ];
  }, [user.id, palette, isDark]);

  return (
    <Paper
      component="article"
      className={styles.card}
      withBorder
      aria-label={name}
    >
      <div
        className={styles.pattern}
        style={
          {
            "--pattern": `url("${patternSrc}")`,
            "--pattern-animated": `url("${animatedPatternSrc}")`,
          } as CSSProperties
        }
        aria-hidden="true"
      />
      <Avatar
        className={styles.avatar}
        src={avatarSrc}
        alt={name}
        radius="md"
        size={64}
      >
        {initials}
      </Avatar>
      <Stack className={styles.details} gap="xs">
        <Group
          className={styles.identity}
          justify="space-between"
          align="start"
          wrap="nowrap"
        >
          <div className={styles.nameBlock}>
            <Text className={styles.name} fw={700} title={name} lineClamp={2}>
              {name}
            </Text>
            <Text className={styles.location} size="sm" c="dimmed">
              {flagCode && (
                <span
                  className={`fi fi-${flagCode} ${styles.flag}`}
                  aria-hidden="true"
                />
              )}
              {user.nationality} <span aria-hidden="true">|</span> Age{" "}
              {user.age}
            </Text>
          </div>
        </Group>
        <div className={styles.hobbies} aria-label="Hobbies">
          {user.hobbies.length === 0 ? (
            <Text size="xs" c="dimmed">
              No hobbies listed
            </Text>
          ) : (
            <OverflowList
              data={user.hobbies}
              gap="xs"
              maxRows={2}
              maxVisibleItems={4}
              renderItem={(hobby) => (
                <Badge key={hobby} variant="light" radius="sm">
                  {hobby}
                </Badge>
              )}
              renderOverflow={(hidden) => (
                <Badge
                  variant="outline"
                  color="gray"
                  radius="sm"
                  aria-label={`${hidden.length} more hobbies`}
                >
                  +{hidden.length}
                </Badge>
              )}
            />
          )}
        </div>
      </Stack>
    </Paper>
  );
}

export default UserCard;
