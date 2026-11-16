import { Container, MantineProvider, Title } from '@mantine/core'
import { theme } from './theme'

export default function App() {
  return (
    <MantineProvider theme={theme} forceColorScheme="light">
      <Container component="main" py="xl">
        <Title order={1}>Frontend practice</Title>
      </Container>
    </MantineProvider>
  )
}
