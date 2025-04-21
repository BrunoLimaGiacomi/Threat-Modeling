import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, MoonIcon, ShieldCheckIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthenticator } from "@aws-amplify/ui-react";
import Logo from "@/assets/aws.svg";

function NavBar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [darkMode, setDarkMode] = useState(false); //TEMP

  const {
    user: { username },
  } = useAuthenticator((context) => [context.user]);

  const navigate = useNavigate();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 shadow-sm md:px-6",
        className,
      )}
      {...props}
    >
      <Link to="/" className="flex w-8 justify-center sm:w-10 md:block">
        <img src={Logo} alt="AWS" />
      </Link>
      <Link
        to="/"
        className="flex items-center gap-1 text-lg font-bold md:gap-2"
      >
        <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="text-xs sm:text-sm md:text-base">
          {import.meta.env.VITE_APP_NAME}
        </span>
      </Link>
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="hidden" // sm:block" TODO: make the switch work
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer sm:h-10 sm:w-10">
              <AvatarImage src={`https://github.com/${username}.png`} />
              <AvatarFallback>
                {username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              You're logged in as {username}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate("/logout")}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export { NavBar };
