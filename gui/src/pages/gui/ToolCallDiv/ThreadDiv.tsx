import { ToolCall } from "core";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { RootState } from "../../../redux/store";

interface ThreadDivProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  toolCall: ToolCall;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  padding: 8px;
  padding-bottom: 0;
`;

const ChildrenDiv = styled.div``;

const W = 16;

const HeaderDiv = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
`;

export function ThreadDiv(props: ThreadDivProps) {
  const availableTools = useSelector(
    (state: RootState) => state.state.config.tools,
  );

  return (
    <Container>
      <HeaderDiv>
        <div
          style={{
            width: `${W}px`,
            height: `${W}px`,
            fontWeight: "bolder",
            marginTop: "1px",
          }}
        >
          {props.icon}
        </div>
        Continue wants to{" "}
        {
          availableTools.find(
            (tool) => props.toolCall.function.name === tool.function.name,
          )?.wouldLikeTo
        }
      </HeaderDiv>
      <ChildrenDiv>{props.children}</ChildrenDiv>
    </Container>
  );
}
