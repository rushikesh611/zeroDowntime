import { Header } from "@/components/header";

const DashboardLayout = ({ children }: {children: React.ReactNode}) => {
    return (
        <div className="flex-col md:flex">
            <div className="border-b-[1px] border-gray-600">
                <div className="flex h-16 items-center px-4">
                    <Header/>
                </div>
            </div>
            {children}
        </div>
    )
}

export default DashboardLayout;