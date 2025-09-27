import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React, { useCallback, useState } from "react";
import z from "zod";

const ValidatedInput = ({
  name,
  submitted,
  errors,
  fieldSchema,
  ...props
}: {
  name: string;
  submitted: boolean;
  errors: string[] | undefined;
  fieldSchema: z.ZodEmail | z.ZodString;
} & React.InputHTMLAttributes<HTMLInputElement>) => {
  const [value, setValue] = useState(props.defaultValue || "");
  const [touched, setTouched] = useState(false);

  const getErrors = useCallback(() => {
    if (!touched && !submitted) {
      return [];
    }

    const validationResult = fieldSchema.safeParse(value);
    return validationResult.success
      ? []
      : validationResult.error.flatten().formErrors;
  }, [fieldSchema, value, touched, submitted]);

  const fieldErrors = errors || getErrors();
  const shouldRenderErrors = errors || submitted || touched;

  const handleBlur = () => setTouched(true);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.currentTarget.value);
    if (!touched) {
      setTouched(true);
    }
  };

  return (
    <div>
      <Input
        id={name}
        name={name}
        onBlur={handleBlur}
        onChange={handleChange}
        className={cn(
          "rounded-sm",
          fieldErrors.length > 0 ? "border-destructive" : ""
        )}
        {...props}
      />
      {shouldRenderErrors && (
        <ul className="text-left">
          {fieldErrors.map((err, idx) => (
            <li key={idx} className="text-sm text-destructive">
              {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ValidatedInput;
