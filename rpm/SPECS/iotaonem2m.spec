Summary: One M2M IoT Agent
Name: iotagent-onem2m
Version: %{_product_version}
Release: %{_product_release}
License: AGPLv3
BuildRoot: %{_topdir}/BUILDROOT/
BuildArch: x86_64
# Requires: nodejs >= 0.10.24
Requires: logrotate
Requires(post): /sbin/chkconfig, /usr/sbin/useradd npm
Requires(preun): /sbin/chkconfig, /sbin/service
Requires(postun): /sbin/service
Group: Applications/Engineering
Vendor: Telefonica I+D
BuildRequires: npm

%description
One M2M IoT Agent is a bridge between OneM2M internal MCA protocol and the NGSI protocol used internally by
Telefonica's IoT Platform.

# System folders
%define _srcdir $RPM_BUILD_ROOT/../../..
%define _service_name iotaOnem2m
%define _install_dir /opt/iotaonem2m
%define _iotaonem2m_log_dir /var/log/iotaonem2m
%define _iotaonem2m_pid_dir /var/run/iotaonem2m

# RPM Building folder
%define _build_root_project %{buildroot}%{_install_dir}
# -------------------------------------------------------------------------------------------- #
# prep section, setup macro:
# -------------------------------------------------------------------------------------------- #
%prep
echo "[INFO] Preparing installation"
# Create rpm/BUILDROOT folder
rm -Rf $RPM_BUILD_ROOT && mkdir -p $RPM_BUILD_ROOT
[ -d %{_build_root_project} ] || mkdir -p %{_build_root_project}

# Copy src files
cp -R %{_srcdir}/lib \
      %{_srcdir}/bin \
      %{_srcdir}/config.js \
      %{_srcdir}/package.json \
      %{_srcdir}/LICENSE \
      %{_build_root_project}

cp -R %{_topdir}/SOURCES/etc %{buildroot}

# -------------------------------------------------------------------------------------------- #
# Build section:
# -------------------------------------------------------------------------------------------- #
%build
echo "[INFO] Building RPM"
cd %{_build_root_project}

# Only production modules
rm -fR node_modules/
npm cache clear
npm install --production

# -------------------------------------------------------------------------------------------- #
# pre-install section:
# -------------------------------------------------------------------------------------------- #
%pre
echo "[INFO] Creating %{_project_user} user"
grep ^%{_project_user}: /etc/passwd
RET_VAL=$?
if [ "$RET_VAL" != "0" ]; then
      /usr/sbin/useradd -s "/bin/bash" -d %{_install_dir} %{_project_user}
      RET_VAL=$?
      if [ "$RET_VAL" != "0" ]; then
         echo "[ERROR] Unable create %{_project_user} user" \
         exit $RET_VAL
      fi
else
      mv %{_install_dir}/config.js /tmp
fi

# -------------------------------------------------------------------------------------------- #
# post-install section:
# -------------------------------------------------------------------------------------------- #
%post
echo "[INFO] Configuring application"
    echo "[INFO] Creating the home One M2M IoT Agent directory"
    mkdir -p _install_dir
    echo "[INFO] Creating log & run directory"
    mkdir -p %{_iotaonem2m_log_dir}
    chown -R %{_project_user}:%{_project_user} %{_iotaonem2m_log_dir}
    chown -R %{_project_user}:%{_project_user} _install_dir
    chmod g+s %{_iotaonem2m_log_dir}
    setfacl -d -m g::rwx %{_iotaonem2m_log_dir}
    setfacl -d -m o::rx %{_iotaonem2m_log_dir}

    mkdir -p %{_iotaonem2m_pid_dir}
    chown -R %{_project_user}:%{_project_user} %{_iotaonem2m_pid_dir}
    chown -R %{_project_user}:%{_project_user} _install_dir
    chmod g+s %{_iotaonem2m_pid_dir}
    setfacl -d -m g::rwx %{_iotaonem2m_pid_dir}
    setfacl -d -m o::rx %{_iotaonem2m_pid_dir}

    echo "[INFO] Configuring application service"
    cd /etc/init.d
    chkconfig --add %{_service_name}

    ls /tmp/config.js
    RET_VAL=$?

    if [ "$RET_VAL" == "0" ]; then
        mv /tmp/config.js %{_install_dir}/config.js
    fi

echo "Done"

# -------------------------------------------------------------------------------------------- #
# pre-uninstall section:
# -------------------------------------------------------------------------------------------- #
%preun

echo "[INFO] stoping service %{_service_name}"
service %{_service_name} stop &> /dev/null

if [ $1 == 0 ]; then

  echo "[INFO] Removing application log files"
  # Log
  [ -d %{_iotaonem2m_log_dir} ] && rm -rfv %{_iotaonem2m_log_dir}

  echo "[INFO] Removing application run files"
  # Log
  [ -d %{_iotaonem2m_pid_dir} ] && rm -rfv %{_iotaonem2m_pid_dir}

  echo "[INFO] Removing application files"
  # Installed files
  [ -d %{_install_dir} ] && rm -rfv %{_install_dir}

  echo "[INFO] Removing application user"
  userdel -fr %{_project_user}

  echo "[INFO] Removing application service"
  chkconfig --del %{_service_name}
  rm -Rf /etc/init.d/%{_service_name}
  echo "Done"
fi

# -------------------------------------------------------------------------------------------- #
# post-uninstall section:
# clean section:
# -------------------------------------------------------------------------------------------- #
%postun
%clean
rm -rf $RPM_BUILD_ROOT

# -------------------------------------------------------------------------------------------- #
# Files to add to the RPM
# -------------------------------------------------------------------------------------------- #
%files
%defattr(755,%{_project_user},%{_project_user},755)
%config /etc/init.d/%{_service_name}
%config /etc/sysconfig/logrotate-iotaonem2m-size
%config /etc/logrotate.d/logrotate-iotaonem2m.conf
%config /etc/cron.d/cron-logrotate-iotaonem2m-size
%{_install_dir}

%changelog
