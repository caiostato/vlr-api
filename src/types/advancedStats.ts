type ExtendedStats = {
  kdr: StatDetail;
  acs: StatDetail;
  k: StatDetail;
  d: StatDetail;
  a: StatDetail;
  kdb: StatDetail;
  kast: StatDetail;
  adr: StatDetail;
  hs: StatDetail;
  fk: StatDetail;
  fd: StatDetail;
  fkdb: StatDetail;
};

type StatDetail = {
  ct: string;
  t: string;
  ot: string;
};

export default ExtendedStats;
