import { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import Slide from "./slide";
import type { Version, Commit } from "./types";
import "./comment-box.css";

interface CommitInfoProps {
  commit: Commit;
  move: number;
  onClick: () => void;
}

function CommitInfo({ commit, move, onClick }: CommitInfoProps) {
  const message = commit.message.split("\n")[0].slice(0, 80);
  const isActive = Math.abs(move) < 0.5;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        transform: `translateX(-50%) translateX(${250 * move}px)`,
        opacity: 1 / (1 + Math.min(0.8, Math.abs(move))),
        zIndex: !isActive ? 2 : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: "5px 0 15px",
        }}
        onClick={onClick}
      >
        {commit.author.avatar && (
          <img
            src={commit.author.avatar}
            alt={commit.author.login}
            height={40}
            width={40}
            style={{ borderRadius: "4px" }}
          />
        )}
        <div style={{ paddingLeft: "6px" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: "500" }}>
            {commit.author.login}
          </div>
          <div style={{ fontSize: "0.85rem", opacity: "0.9" }}>
            {isActive && commit.commitUrl ? (
              <a
                href={commit.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                on {commit.date.toDateString()}
              </a>
            ) : (
              `on ${commit.date.toDateString()}`
            )}
          </div>
        </div>
      </div>
      {isActive && (
        <div
          className="comment-box"
          title={commit.message}
          style={{ opacity: 1 - 2 * Math.abs(move) }}
        >
          {message}
          {message !== commit.message ? " ..." : ""}
        </div>
      )}
    </div>
  );
}

interface CommitListProps {
  commits: Commit[];
  currentIndex: number;
  selectCommit: (index: number) => void;
}

function CommitList({ commits, currentIndex, selectCommit }: CommitListProps) {
  const mouseWheelEvent = (e: React.WheelEvent) => {
    e.preventDefault();
    selectCommit(currentIndex - (e.deltaX + e.deltaY) / 100);
  };
  return (
    <div
      onWheel={mouseWheelEvent}
      style={{
        overflow: "hidden",
        width: "100%",
        height: "100px",
        position: "fixed",
        top: 0,
        background: "rgb(1, 22, 39)",
        zIndex: 1,
      }}
    >
      {commits.map((commit, commitIndex) => (
        <CommitInfo
          commit={commit}
          move={currentIndex - commitIndex}
          key={commitIndex}
          onClick={() => selectCommit(commitIndex)}
        />
      ))}
    </div>
  );
}

interface HistoryProps {
  versions: Version[];
  loadMore: () => void;
}

export default function History({ versions, loadMore }: HistoryProps) {
  return <Slides versions={versions} loadMore={loadMore} />;
}

function Slides({ versions, loadMore }: HistoryProps) {
  const [current, target, setTarget] = useSliderSpring(0);
  const commits = versions.map((v) => v.commit);

  const setClampedTarget = (newTarget: number) => {
    setTarget(Math.min(commits.length - 0.75, Math.max(-0.25, newTarget)));
    if (newTarget >= commits.length - 5) {
      loadMore();
    }
  };

  const index = Math.round(current);
  const nextSlide = () => setClampedTarget(Math.round(target - 0.51));
  const prevSlide = () => setClampedTarget(Math.round(target + 0.51));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === " ") {
        setClampedTarget(current);
      }
    };
    document.body.addEventListener("keydown", handleKeyDown);
    return () => document.body.removeEventListener("keydown", handleKeyDown);
  });

  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextSlide,
    onSwipedRight: prevSlide,
  });

  const version = versions[index];
  if (!version) return null;

  return (
    <>
      <CommitList
        commits={commits}
        currentIndex={current}
        selectCommit={(idx) => setClampedTarget(idx)}
      />
      <div {...swipeHandlers} style={{ height: "100%" }}>
        <Slide time={index - current} version={version} />
      </div>
    </>
  );
}

function useSliderSpring(
  initial: number
): [number, number, (value: number) => void] {
  const [target, setTarget] = useState(initial);
  const [current, setCurrent] = useState(initial);

  useEffect(() => {
    if (Math.abs(current - target) < 0.01) {
      setCurrent(target);
      return;
    }

    const animationId = requestAnimationFrame(() => {
      setCurrent((prev) => prev + (target - prev) * 0.1);
    });

    return () => cancelAnimationFrame(animationId);
  }, [current, target]);

  return [Math.round(current * 100) / 100, target, setTarget];
}
