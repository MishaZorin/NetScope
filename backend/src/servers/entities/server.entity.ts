import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Server {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  host!: string;

  @Column({ default: 22 })
  port!: number;

  @Column()
  username!: string;

  // Задаем дефолтное значение для базы данных и самого свойства класса
  @Column({ default: 'password' }) 
  authType!: 'password';

  @Column({ type: 'text' })
  password!: string;

  @Column({ nullable: true }) // Сделаем пока nullable, так как в логе там тоже прилетал null
  userId!: string;
}
