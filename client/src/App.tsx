import { Container, Stack, Text, Title } from '@mantine/core';
import styles from './App.module.scss';

function App() {
  return (
    <Container className={styles.shell} size="sm">
      <Stack className={styles.content}>
        <Text className={styles.eyebrow}>
          Presight directory
        </Text>
        <Title className={styles.title} order={1}>
          People, easier to find.
        </Title>
        <Text className={styles.status}>The directory foundation is ready.</Text>
      </Stack>
    </Container>
  );
}

export default App;
