import { Field, ID, ObjectType, InputType, Float, Int, GraphQLISODateTime } from '@nestjs/graphql';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@ObjectType()
@Entity('pedidos')
export class Pedido {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  producto: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  descripcion: string | null;

  @Field(() => Int)
  @Column()
  cantidad: number;

  @Field(() => Float)
  @Column({ type: 'float' })
  precioUnitario: number;

  @Field(() => Float)
  @Column({ type: 'float' })
  subtotal: number;

  @Field(() => ID)
  @Column()
  usuarioId: string;

  @Field(() => ID)
  @Column()
  ordenId: string;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  creadoEn: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  actualizadoEn: Date;
}

@InputType()
export class CrearPedidoInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  producto: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  cantidad: number;

  @Field(() => Float)
  @IsNumber()
  @IsPositive()
  precioUnitario: number;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  usuarioId: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  ordenId: string;
}

@InputType()
export class ActualizarPedidoInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  producto?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  descripcion?: string | null;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  precioUnitario?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  ordenId?: string;
}
