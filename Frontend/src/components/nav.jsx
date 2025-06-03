import React, { useState } from "react";
import Tg from "./toggle";
import { ConnectButton } from '@tomo-inc/tomo-evm-kit';
import SideMenu from './Sidemenu';

function Nav() {
  const [isOpen, setIsOpen] = useState(false);

  function logout() {
    localStorage.clear();
    window.location.reload();
  }

  return (
    <div className='navbar navbar-expand navbar-light bg-white topbar mb-4 shadow fixed-top-bar'>
      <div className="text-lg mx-3 no-underline">
        <a className="flex items-center justify-center alchemy-link" href="/">
          <div className="mmh text-lg mx-3">CLUBDAO</div>
        </a>
      </div>
      <button
        id="sidebarToggleTop"
        className="btn btn-link d-md-none rounded-circle mr-3"
        onClick={Tg}
      >
        <i className="fa fa-bars" />
      </button>
      <ul className="navbar-nav ml-auto">
        <div className="topbar-divider d-none d-sm-block" />
      </ul>
      <div className='maincomp flex'>
        {isOpen && (
          <SideMenu
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            logout={logout}
          />
        )}
        <div className="tomo-connect-button">
          <ConnectButton />
        </div>
      </div>
    </div>
  );
}

export default Nav;