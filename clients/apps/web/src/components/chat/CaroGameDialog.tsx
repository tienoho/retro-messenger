import { useState } from "react";
import { YahooLogoIcon } from "../../icons/UiIcons";

export interface CaroGameDialogProps {
  partnerName: string;
  onClose: () => void;
  onSendGameMessage?: ((text: string) => void) | undefined;
}

type CellValue = "X" | "O" | null;

export function CaroGameDialog({
  partnerName,
  onClose,
  onSendGameMessage,
}: CaroGameDialogProps) {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const calculateWinner = (squares: CellValue[]): CellValue | "draw" | null => {
    const lines: Array<[number, number, number]> = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      const sqA = squares[a];
      const sqB = squares[b];
      const sqC = squares[c];
      if (sqA && sqA === sqB && sqA === sqC) {
        return sqA;
      }
    }
    if (squares.every((sq) => sq !== null)) {
      return "draw";
    }
    return null;
  };

  const winner = calculateWinner(board);

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const nextBoard = [...board];
    const player = isXNext ? "X" : "O";
    nextBoard[index] = player;
    setBoard(nextBoard);
    setIsXNext(!isXNext);

    const checkWin = calculateWinner(nextBoard);
    if (checkWin === "draw") {
      onSendGameMessage?.("[Yahoo! Games] Trận cờ Caro đã kết thúc với kết quả Hòa!");
    } else if (checkWin) {
      onSendGameMessage?.(
        `[Yahoo! Games] Người chơi ${checkWin === "X" ? "Bạn (X)" : `${partnerName} (O)`} đã chiến thắng cờ Caro!`,
      );
    }
  };

  const handleRestart = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="retroModalBackdrop" onClick={onClose}>
      <div
        className="retroModalDialog caroBox"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Yahoo! Games - Cờ Caro"
      >
        <div className="retroModalHeader">
          <div className="retroModalTitle">
            <YahooLogoIcon size={14} style={{ marginRight: 6 }} />
            <span>Yahoo! Games — Cờ Caro (với {partnerName})</span>
          </div>
          <button
            type="button"
            className="winControlBtn closeBtn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="retroModalBody caroContent">
          <div className="caroStatusStrip">
            {winner === "draw" ? (
              <strong style={{ color: "#d97706" }}>Hòa cờ! Bắt đầu lại nhé!</strong>
            ) : winner ? (
              <strong style={{ color: winner === "X" ? "#cc0000" : "#0000cc" }}>
                Người chơi {winner} ({winner === "X" ? "Bạn" : partnerName}) đã thắng!
              </strong>
            ) : (
              <span>
                Lượt đánh:{" "}
                <strong style={{ color: isXNext ? "#cc0000" : "#0000cc" }}>
                  {isXNext ? "Bạn (X)" : `${partnerName} (O)`}
                </strong>
              </span>
            )}
          </div>

          <div className="caroGrid">
            {board.map((cell, idx) => (
              <button
                key={idx}
                type="button"
                className={`caroCell ${cell ? cell.toLowerCase() : ""}`}
                onClick={() => handleClick(idx)}
                disabled={Boolean(cell || winner)}
              >
                {cell}
              </button>
            ))}
          </div>

          <div className="retroModalActions" style={{ justifyContent: "space-between" }}>
            <button
              type="button"
              className="retroBtn primary"
              onClick={handleRestart}
            >
              Chơi lại ván mới
            </button>
            <button
              type="button"
              className="retroBtn"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

