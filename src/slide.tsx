import animation from "./animation";
import theme from "./nightOwl";
import Scroller from "./scroller";
import type { Line, Token, Change, Version, LineStyle } from "./types";

interface StylesData {
  styles: LineStyle[];
}

function getLineHeight(_line: Line, i: number, { styles }: StylesData): number {
  const style = styles[i];
  return style?.height != null ? style.height : 15;
}

function getTokenStyle(token: Token): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (token.color) {
    style.color = token.color;
  }
  if (token.fontStyle) {
    if (token.fontStyle & 1) {
      style.fontStyle = "italic";
    }
    if (token.fontStyle & 2) {
      style.fontWeight = "bold";
    }
  }
  return style;
}

function getLine(line: Line, i: number, { styles }: StylesData) {
  const style = styles[i];
  return (
    <div
      style={{ overflow: "hidden", height: "15px", ...style }}
      key={line.key}
    >
      {!line.tokens.length && <br />}
      {line.tokens.map((token, j) => {
        const tokenStyle = getTokenStyle(token);
        return (
          <span style={tokenStyle} key={j}>
            {token.content}
          </span>
        );
      })}
    </div>
  );
}

interface SlideProps {
  lines: Line[];
  styles: LineStyle[];
  changes: Change[];
}

function Slide({ lines, styles, changes }: SlideProps) {
  return (
    <pre
      style={{
        backgroundColor: theme.plain.backgroundColor,
        color: theme.plain.color,
        paddingTop: "100px",
        margin: 0,
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Scroller
        items={lines}
        getRow={getLine}
        getRowHeight={getLineHeight}
        data={{ styles }}
        snapAreas={changes}
      />
    </pre>
  );
}

interface SlideWrapperProps {
  time: number;
  version: Version;
}

export default function SlideWrapper({ time, version }: SlideWrapperProps) {
  const { lines, changes } = version;
  const result = animation((time + 1) / 2, lines);
  // animation returns LineStyle[] when called with an array of lines
  const styles = Array.isArray(result) ? result : [result];
  return <Slide lines={lines} styles={styles} changes={changes} />;
}
