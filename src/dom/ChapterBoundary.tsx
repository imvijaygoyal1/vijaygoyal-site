import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  id: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class ChapterBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn(`Chapter "${this.props.id}" scene failed:`, error, info.componentStack);
  }

  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
