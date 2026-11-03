import React from "react";
import { ScrollView, View, Text } from "react-native";
import { subscribe, getError } from "../errorStore";

// Catches render errors AND (via errorStore) global JS errors, and shows them
// on screen instead of letting the app crash silently. Diagnostic aid.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: getError() };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
  }

  componentDidMount() {
    this._unsub = subscribe((e) => this.setState({ error: e }));
  }

  componentWillUnmount() {
    if (this._unsub) this._unsub();
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    const msg = error && (error.message || String(error));
    const stack = (error && error.stack) || (info && info.componentStack) || "";

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: "#2b0a0a" }}
        contentContainerStyle={{ padding: 20, paddingTop: 60 }}
      >
        <Text style={{ color: "#ff8080", fontSize: 20, fontWeight: "800", marginBottom: 10 }}>
          App crashed — screenshot this
        </Text>
        <Text style={{ color: "#ffd0d0", fontSize: 15, fontWeight: "700", marginBottom: 12 }}>
          {msg}
        </Text>
        <Text style={{ color: "#ffb3b3", fontSize: 12, fontFamily: "monospace" }}>
          {String(stack).slice(0, 4000)}
        </Text>
      </ScrollView>
    );
  }
}
