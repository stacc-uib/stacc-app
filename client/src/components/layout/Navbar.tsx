import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../styles.css";

const navItems = [
	{ icon: "bi-currency-dollar", label: "Finance" },
	{ icon: "bi-graph-up-arrow", label: "Analytics" },
	{ icon: "bi-person-fill", label: "User" },
	{ icon: "bi-arrow-left-right", label: "Transfer" },
	{ icon: "bi bi-clipboard", label: "Report" },
	{ icon: "bi-plus-square", label: "Add" },
];

interface NavbarProps {
	style?: React.CSSProperties;
}

const Navbar: React.FC<NavbarProps> = ({ style }) => {
	return (
		<nav
			style={{
				width: "60px",
				background: "#10151b",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "space-evenly",
				padding: "0",
				borderRight: "2px solid #da1e24",
				height: "100%",
				...style,
			}}
		>
			{navItems.map((item) => (
				<button
					key={item.icon}
					title={item.label}
					style={{
						background: "none",
						border: "none",
						color: "#da1e24",
						fontSize: 32,
						cursor: "pointer",
						transition: "color 0.2s",
					}}
				>
					<i className={`bi ${item.icon}`} />
				</button>
			))}
		</nav>
	);
};

export default Navbar;