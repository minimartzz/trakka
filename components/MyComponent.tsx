import React, { useRef } from "react";

const MyComponent: React.FC = () => {
  // Specify the type of the DOM element as the generic argument to useRef
  // The 'null' indicates the initial value before the ref is attached to an element
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    // TypeScript will now know that inputRef.current is either an HTMLInputElement or null
    // You must check if the current value exists before trying to access its methods
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div>
      <input type="text" ref={inputRef} />
      <button onClick={handleFocus}>Focus the Input</button>
    </div>
  );
};

export default MyComponent;
