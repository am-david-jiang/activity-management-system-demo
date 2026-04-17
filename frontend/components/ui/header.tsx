"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/context/auth-context";

const navItems = [
    { title: "活动管理系统", href: "/" },
    { title: "创建活动", href: "/create-activity" },
    { title: "参与者管理", href: "/participants" },
    { title: "活动参与者管理", href: "/activity-participants" },
    { title: "活动日程安排", href: "/scheduler" },
    {
        title: "创建活动海报",
        href: "/poster-gen",
    },
    { title: "设置", href: "/settings" },
];

function getBreadcrumbItems(pathname: string) {
    if (pathname === "/") {
        return [{ title: "活动管理系统", href: "/" }];
    }
    const items = navItems.filter(
        (item) => item.href !== "/" && pathname.startsWith(item.href),
    );
    if (items.length > 0) {
        return [navItems[0], items[items.length - 1]];
    }
    return [{ title: "活动管理系统", href: "/" }];
}

function Header() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const breadcrumbItems = getBreadcrumbItems(pathname);

    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    };

    const getAvatarFallback = (name: string) => {
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <header className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Separator
                    orientation="vertical"
                    className="h-6 data-vertical:self-auto"
                />
                <Breadcrumb className="ml-2">
                    <BreadcrumbList>
                        {breadcrumbItems.flatMap((item, index) => {
                            const elements = [];
                            elements.push(
                                <BreadcrumbItem key={`item-${index}`}>
                                    {index === breadcrumbItems.length - 1 ? (
                                        <BreadcrumbPage>
                                            {item.title}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link href={item.href}>
                                                {item.title}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>,
                            );
                            if (index < breadcrumbItems.length - 1) {
                                elements.push(
                                    <BreadcrumbSeparator key={`sep-${index}`} />,
                                );
                            }
                            return elements;
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button type="button" className="rounded-full">
                            <Avatar size="default">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {user ? getAvatarFallback(user.name) : "??"}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            {user?.name ?? "User"}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleLogout}>
                            <LogOutIcon className="size-4" />
                            退出登录
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

export { Header };
