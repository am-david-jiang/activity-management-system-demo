"use client";

import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Field,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldDescription,
    FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TextInputField } from "@/components/form/text-input-field";
import { toast } from "sonner";
import Image from "next/image";

const loginSchema = z.object({
    email: z.email("请输入有效的邮箱地址"),
    password: z.string().min(1, "密码不能为空"),
});

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        validators: {
            onSubmit: loginSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                await login(value.email, value.password);
                toast.success("登录成功");
                router.push("/");
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : "登录失败",
                );
            }
        },
    });

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-4xl">
                <Card className="overflow-hidden p-0">
                    <CardContent className="grid p-0 md:grid-cols-2">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.handleSubmit();
                            }}
                            className="p-6 md:p-8"
                        >
                            <FieldGroup>
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <h1 className="text-2xl font-bold">
                                        欢迎回来
                                    </h1>
                                    <p className="text-balance text-muted-foreground">
                                        登录到您的活动管理系统账号
                                    </p>
                                </div>

                                <form.Field
                                    name="email"
                                    /* eslint-disable-next-line react/no-children-prop */
                                    children={(field) => (
                                        <TextInputField
                                            name={field.name}
                                            label="邮箱"
                                            value={field.state.value}
                                            onChange={field.handleChange}
                                            onBlur={field.handleBlur}
                                            errors={field.state.meta.errors}
                                        />
                                    )}
                                />

                                <form.Field
                                    name="password"
                                    /* eslint-disable-next-line react/no-children-prop */
                                    children={(field) => (
                                        <Field orientation="vertical">
                                            <div className="flex items-center">
                                                <FieldLabel
                                                    htmlFor={field.name}
                                                >
                                                    密码
                                                </FieldLabel>
                                                <a
                                                    href="#"
                                                    className="ml-auto text-sm underline-offset-2 hover:underline"
                                                >
                                                    忘记密码？
                                                </a>
                                            </div>
                                            <FieldContent>
                                                <Input
                                                    id={field.name}
                                                    type="password"
                                                    value={field.state.value}
                                                    onChange={(e) =>
                                                        field.handleChange(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onBlur={field.handleBlur}
                                                />
                                                <FieldError
                                                    errors={
                                                        field.state.meta.errors
                                                    }
                                                />
                                            </FieldContent>
                                        </Field>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    disabled={
                                        !form.state.canSubmit ||
                                        form.state.isSubmitting
                                    }
                                    className="w-full"
                                >
                                    {form.state.isSubmitting
                                        ? "登录中..."
                                        : "登录"}
                                </Button>

                                <FieldDescription className="text-center">
                                    没有账号？{" "}
                                    <a
                                        href="/register"
                                        className="underline underline-offset-4"
                                    >
                                        注册
                                    </a>
                                </FieldDescription>
                            </FieldGroup>
                        </form>
                        <div className="relative hidden bg-muted md:block">
                            <Image
                                src="/login.jpg"
                                width={450}
                                height={450}
                                alt="Image"
                                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                            />
                        </div>
                    </CardContent>
                </Card>
                <p className="mt-4 px-6 text-muted-foreground text-sm text-center">
                    点击继续即表示您同意我们的{" "}
                    <a href="#" className="underline">
                        服务条款
                    </a>{" "}
                    和{" "}
                    <a href="#" className="underline">
                        隐私政策
                    </a>
                    。
                </p>
            </div>
        </div>
    );
}
